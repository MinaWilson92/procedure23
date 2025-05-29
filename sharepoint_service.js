// services/sharepoint.js - SharePoint service

const fs = require('fs');
const path = require('path');
const axios = require('axios');
const config = require('../config/config');

// Helper class for SharePoint operations
class SharePointHelper {
  static generateFolderPath(procedureData) {
    const { lob, procedure_subsection } = procedureData;
    const year = new Date().getFullYear();
    
    let folderPath = lob || 'General';
    if (procedure_subsection) {
      folderPath += `/${procedure_subsection}`;
    }
    folderPath += `/${year}`;
    
    return folderPath.replace(/[<>:"/\\|?*]/g, '_');
  }

  static generateFileName(procedureData) {
    const { name, lob, uploaded_by } = procedureData;
    const timestamp = new Date().toISOString().slice(0, 10);
    
    let fileName = `${lob || 'GEN'}_${name}_${timestamp}_${uploaded_by}`;
    fileName = fileName.replace(/[<>:"/\\|?*]/g, '_').substring(0, 100);
    
    return fileName;
  }

  static extractSharePointCookies(req) {
    const spCookies = {};
    const cookieNames = [
      'FedAuth', 'rtFa', 'EdgeAccessCookie', 'SPOIDCRL',
      'SPRequestGuid', 'WSS_FullScreenMode'
    ];

    if (req.cookies) {
      cookieNames.forEach(cookieName => {
        if (req.cookies[cookieName]) {
          spCookies[cookieName] = req.cookies[cookieName];
        }
      });
    }

    return spCookies;
  }
}

// SharePoint User Client class for handling uploads
class SharePointUserClient {
  constructor() {
    this.cookies = {};
    this.headers = {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      'Accept': 'application/json;odata=verbose',
      'Content-Type': 'application/json;odata=verbose',
      'X-RequestDigest': ''
    };
  }

  extractSharePointSession(req) {
    this.cookies = SharePointHelper.extractSharePointCookies(req);
    
    // Build cookie string for requests
    this.cookieString = Object.entries(this.cookies)
      .map(([name, value]) => `${name}=${value}`)
      .join('; ');
    
    if (this.cookieString) {
      this.headers['Cookie'] = this.cookieString;
    }
  }

  async getRequestDigest(siteUrl) {
    try {
      const response = await axios.post(
        `${siteUrl}/_api/contextinfo`,
        {},
        {
          headers: {
            ...this.headers,
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          timeout: 10000
        }
      );

      if (response.data && response.data.d && response.data.d.GetContextWebInformation) {
        return response.data.d.GetContextWebInformation.FormDigestValue;
      }
      
      throw new Error('Unable to get request digest from SharePoint');
    } catch (error) {
      console.error('❌ Error getting SharePoint request digest:', error.message);
      throw new Error(`Failed to authenticate with SharePoint: ${error.message}`);
    }
  }

  async uploadViaRestApi(filePath, fileName, folderPath, metadata = {}) {
    try {
      const fileBuffer = fs.readFileSync(filePath);
      const fileUrl = `${config.SHAREPOINT.baseFolderPath}/${folderPath}/${fileName}`;
      
      // Get request digest
      const digest = await this.getRequestDigest(config.SHAREPOINT.siteUrl);
      this.headers['X-RequestDigest'] = digest;

      // Upload file
      const uploadResponse = await axios.post(
        `${config.SHAREPOINT.siteUrl}/_api/web/GetFolderByServerRelativeUrl('${config.SHAREPOINT.baseFolderPath}/${folderPath}')/Files/add(url='${fileName}',overwrite=true)`,
        fileBuffer,
        {
          headers: {
            ...this.headers,
            'Content-Type': 'application/octet-stream',
            'Content-Length': fileBuffer.length
          },
          timeout: 30000,
          maxContentLength: 50 * 1024 * 1024 // 50MB limit
        }
      );

      if (uploadResponse.status === 200 || uploadResponse.status === 201) {
        console.log('✅ File uploaded to SharePoint successfully');
        
        // Update file metadata if provided
        if (Object.keys(metadata).length > 0) {
          try {
            await this.updateFileMetadata(fileUrl, metadata);
          } catch (metaError) {
            console.warn('⚠️ File uploaded but metadata update failed:', metaError.message);
          }
        }

        return {
          success: true,
          webUrl: `${config.SHAREPOINT.siteUrl}${fileUrl}`,
          serverRelativeUrl: fileUrl,
          fileName: fileName,
          folderPath: folderPath
        };
      } else {
        throw new Error(`Upload failed with status: ${uploadResponse.status}`);
      }

    } catch (error) {
      console.error('❌ SharePoint REST API upload failed:', error.message);
      throw new Error(`SharePoint upload failed: ${error.message}`);
    }
  }

  async updateFileMetadata(fileUrl, metadata) {
    try {
      const updateResponse = await axios.post(
        `${config.SHAREPOINT.siteUrl}/_api/web/GetFileByServerRelativeUrl('${fileUrl}')/ListItemAllFields`,
        metadata,
        {
          headers: {
            ...this.headers,
            'X-HTTP-Method': 'MERGE',
            'If-Match': '*'
          },
          timeout: 10000
        }
      );

      console.log('✅ File metadata updated successfully');
      return updateResponse.data;
    } catch (error) {
      console.error('❌ Error updating file metadata:', error.message);
      throw error;
    }
  }

  async createFolder(folderPath) {
    try {
      const folderResponse = await axios.post(
        `${config.SHAREPOINT.siteUrl}/_api/web/folders`,
        {
          '__metadata': { 'type': 'SP.Folder' },
          'ServerRelativeUrl': `${config.SHAREPOINT.baseFolderPath}/${folderPath}`
        },
        {
          headers: this.headers,
          timeout: 10000
        }
      );

      console.log('✅ SharePoint folder created:', folderPath);
      return folderResponse.data;
    } catch (error) {
      if (error.response && error.response.status === 409) {
        console.log('📁 Folder already exists:', folderPath);
        return { exists: true };
      }
      console.error('❌ Error creating SharePoint folder:', error.message);
      throw error;
    }
  }
}

// Main SharePoint Service class
class SharePointService {
  constructor() {
    this.client = new SharePointUserClient();
  }

  async uploadFile(req, procedureData) {
    try {
      console.log('📤 Starting SharePoint upload...');
      
      const spCookies = SharePointHelper.extractSharePointCookies(req);
      
      if (Object.keys(spCookies).length === 0) {
        throw new Error('SharePoint session required. Please login to SharePoint first.');
      }

      const folderPath = SharePointHelper.generateFolderPath(procedureData);
      const fileName = SharePointHelper.generateFileName(procedureData) + path.extname(req.file.originalname);

      console.log('📁 Upload destination:', {
        folderPath,
        fileName,
        fileSize: req.file.size
      });

      // Use SharePoint client for upload
      this.client.extractSharePointSession(req);

      // Create folder if it doesn't exist
      await this.client.createFolder(folderPath);

      const result = await this.client.uploadViaRestApi(
        req.file.path,
        fileName,
        folderPath,
        {
          Title: procedureData.name,
          LOB: procedureData.lob,
          UploadedBy: req.staffId,
          UploadDate: new Date().toISOString()
        }
      );

      console.log('✅ SharePoint upload completed successfully');
      return result;

    } catch (error) {
      console.error('❌ SharePoint upload error:', error);
      throw error;
    }
  }

  generateUploadForm(req, procedureData) {
    const folderPath = SharePointHelper.generateFolderPath(procedureData);
    const fileName = SharePointHelper.generateFileName(procedureData);
    const fullFolderPath = `${config.SHAREPOINT.baseFolderPath}/${folderPath}`;
    
    const redirectUrl = `${req.protocol}://${req.get('host')}/ProceduresHubEG6/sharepoint-success`;

    return {
      siteUrl: config.SHAREPOINT.siteUrl,
      folderPath: fullFolderPath,
      fileName: fileName,
      redirectUrl: redirectUrl,
      uploadUrl: `${config.SHAREPOINT.siteUrl}/_layouts/15/uploadex.aspx`
    };
  }

  getConfig(req, procedureData) {
    const spCookies = SharePointHelper.extractSharePointCookies(req);
    const hasSharePointSession = Object.keys(spCookies).length > 0;

    const folderPath = SharePointHelper.generateFolderPath(procedureData);
    const fileName = SharePointHelper.generateFileName(procedureData);

    // Generate upload URLs
    const baseUrl = config.SHAREPOINT.siteUrl;
    const encodedFolderPath = encodeURIComponent(`${config.SHAREPOINT.baseFolderPath}/${folderPath}`);
    
    const uploadUrls = {
      uploadUrl: `${baseUrl}/_layouts/15/upload.aspx?List=${config.SHAREPOINT.libraryName}&RootFolder=${encodedFolderPath}`,
      folderUrl: `${baseUrl}/${config.SHAREPOINT.baseFolderPath}/${folderPath}`.replace(/\/+/g, '/'),
      libraryUrl: `${baseUrl}/_layouts/15/viewlsts.aspx?view=14`
    };

    return {
      success: true,
      hasSharePointSession,
      config: {
        siteUrl: config.SHAREPOINT.siteUrl,
        libraryName: config.SHAREPOINT.libraryName,
        folderPath: folderPath,
        suggestedFileName: fileName,
        fullPath: `${config.SHAREPOINT.baseFolderPath}/${folderPath}/${fileName}`
      },
      uploadOptions: {
        restApiUpload: hasSharePointSession,
        clientUpload: true,
        formUpload: true
      },
      urls: uploadUrls,
      user: {
        staffId: req.staffId,
        displayName: req.userInfo?.displayName
      },
      instructions: hasSharePointSession ? 
        'SharePoint session detected. You can upload directly via our system or use SharePoint interface.' :
        'No SharePoint session detected. Please use the SharePoint interface option or login to SharePoint first.'
    };
  }
}

module.exports = SharePointService;