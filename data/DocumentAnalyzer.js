// services/DocumentAnalyzer.js - Enhanced with AI and SharePoint integration
import { sharePointPaths } from '../config/paths';

class DocumentAnalyzer {
  constructor() {
    this.minimumScore = 85;
    
    // LOB subsection configuration for UI
    this.lobSubsections = {
      'IWPB': [
        { value: 'risk_management', label: 'Risk Management' },
        { value: 'compliance', label: 'Compliance & Regulatory' },
        { value: 'operational', label: 'Operational Procedures' },
        { value: 'financial', label: 'Financial Controls' },
        { value: 'technology', label: 'Technology & Security' }
      ],
      'CIB': [
        { value: 'trading', label: 'Trading Operations' },
        { value: 'sales', label: 'Sales Procedures' },
        { value: 'research', label: 'Research & Analysis' },
        { value: 'credit', label: 'Credit Management' }
      ],
      'GCOO': [
        { value: 'operations', label: 'Operations' },
        { value: 'technology', label: 'Technology' },
        { value: 'change_management', label: 'Change Management' },
        { value: 'project_management', label: 'Project Management' }
      ]
    };
  }

  // ============================================================================
  // UI HELPER METHODS
  // ============================================================================

  getSubsections(lob) {
    return this.lobSubsections[lob] || [];
  }

  validateFile(file) {
    const allowedTypes = [
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/msword'
    ];
    
    if (!allowedTypes.includes(file.type)) {
      throw new Error('Please select a PDF or Word document (.pdf, .docx, .doc)');
    }

    if (file.size > 10 * 1024 * 1024) {
      throw new Error('File size must be less than 10MB');
    }

    return true;
  }

  // ============================================================================
  // DOCUMENT PROCESSING METHODS  
  // ============================================================================

  async analyzeDocument(file, metadata = {}) {
    try {
      console.log('🔍 Starting client-side AI analysis...');
      
      // Extract text from file
      const text = await this.extractTextFromFile(file);
      
      // ✅ USE YOUR EXISTING AI ANALYSIS LOGIC
      if (!window.documentAnalysis) {
        throw new Error('Document analysis engine not loaded. Please ensure documentAnalysis.js is included.');
      }
      
      const analysis = await window.documentAnalysis.analyzeDocument(text, file.type, metadata);
      
      analysis.accepted = analysis.score >= this.minimumScore;
      
      console.log('✅ AI Analysis completed:', {
        score: analysis.score,
        accepted: analysis.accepted,
        templateCompliance: analysis.details?.summary?.templateCompliance
      });

      return analysis;
      
    } catch (error) {
      console.error('❌ AI analysis failed:', error);
      throw new Error(`Document analysis failed: ${error.message}`);
    }
  }

  async extractTextFromFile(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = async (e) => {
        try {
          let text = '';
          
          if (file.type === 'application/pdf') {
            text = await this.extractPDFText(e.target.result);
          } else if (file.type.includes('wordprocessingml') || file.type.includes('msword')) {
            text = await this.extractWordText(e.target.result);
          } else {
            throw new Error('Unsupported file type');
          }
          
          resolve(text);
        } catch (error) {
          reject(error);
        }
      };
      
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsArrayBuffer(file);
    });
  }

  async extractPDFText(arrayBuffer) {
    try {
      // ✅ Use PDF.js CDN (add script tag to your SharePoint page)
      const pdfjsLib = window['pdfjs-dist/build/pdf'];
      
      if (!pdfjsLib) {
        throw new Error('PDF.js library not loaded. Please ensure PDF.js CDN is included in SharePoint page.');
      }

      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      let fullText = '';

      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        const pageText = textContent.items.map(item => item.str).join(' ');
        fullText += pageText + '\n';
      }

      console.log('✅ PDF text extracted, length:', fullText.length);
      return fullText;
      
    } catch (error) {
      console.error('❌ PDF extraction failed:', error);
      throw new Error('Failed to extract text from PDF: ' + error.message);
    }
  }

  async extractWordText(arrayBuffer) {
    try {
      // ✅ Use mammoth.js CDN (add script tag to your SharePoint page)
      const mammoth = window.mammoth;
      
      if (!mammoth) {
        throw new Error('Mammoth.js library not loaded. Please ensure mammoth.js CDN is included in SharePoint page.');
      }

      const result = await mammoth.extractRawText({ arrayBuffer: arrayBuffer });
      
      console.log('✅ Word document text extracted, length:', result.value.length);
      return result.value;
      
    } catch (error) {
      console.error('❌ Word extraction failed:', error);
      throw new Error('Failed to extract text from Word document: ' + error.message);
    }
  }

  // ============================================================================
  // SHAREPOINT INTEGRATION METHODS
  // ============================================================================

  async uploadProcedureWithAnalysis(formData, file) {
    try {
      console.log('🚀 Starting procedure upload with AI analysis...');
      
      // 1. Analyze document first
      const analysisResult = await this.analyzeDocument(file, {
        name: formData.name,
        lob: formData.lob,
        subsection: formData.procedure_subsection
      });
      
      if (!analysisResult.accepted) {
        throw new Error(`Document quality score is ${analysisResult.score}% (minimum 80% required)`);
      }

      console.log('✅ Document passed AI analysis:', {
        score: analysisResult.score,
        templateCompliance: analysisResult.details?.summary?.templateCompliance
      });

      // 2. Get SharePoint context
      const requestDigest = await this.getRequestDigest();
      
      // 3. Upload file to SharePoint
      const sharePointPath = sharePointPaths.getSharePointPath(formData.lob, formData.procedure_subsection);
      const fileUploadResult = await this.uploadFileToSharePoint(file, sharePointPath, requestDigest);
      
      // 4. Create procedure list item with comprehensive AI data
      const procedureData = {
        __metadata: { type: 'SP.Data.ProceduresListItem' },
        Title: formData.name,
        ExpiryDate: formData.expiry,
        PrimaryOwner: formData.primary_owner,
        PrimaryOwnerEmail: formData.primary_owner_email || `${formData.primary_owner}@hsbc.com`,
       SecondaryOwner: formData.secondary_owner || '',
       SecondaryOwnerEmail: formData.secondary_owner_email || '',
       LOB: formData.lob,
       ProcedureSubsection: formData.procedure_subsection,
       SharePointPath: sharePointPath,
       DocumentLink: fileUploadResult.serverRelativeUrl,
       OriginalFilename: file.name,
       FileSize: file.size,
       
       // ✅ COMPREHENSIVE AI ANALYSIS RESULTS
       QualityScore: analysisResult.score,
       TemplateCompliance: analysisResult.details?.summary?.templateCompliance || 'Unknown',
       AnalysisDetails: JSON.stringify(analysisResult.details),
       AIRecommendations: JSON.stringify(analysisResult.aiRecommendations || []),
       
       // ✅ EXTRACTED HSBC-SPECIFIC DATA
       RiskRating: analysisResult.details?.riskRating || 'Not Specified',
       PeriodicReview: analysisResult.details?.periodicReview || 'Not Specified',
       DocumentOwners: JSON.stringify(analysisResult.details?.owners || []),
       SignOffDates: JSON.stringify(analysisResult.details?.signOffDates || []),
       Departments: JSON.stringify(analysisResult.details?.departments || []),
       
       // ✅ DETAILED ANALYSIS METRICS
       FoundElements: JSON.stringify(analysisResult.details?.foundElements || []),
       MissingElements: JSON.stringify(analysisResult.details?.missingElements || []),
       HasDocumentControl: analysisResult.details?.hasDocumentControl || false,
       HasRiskAssessment: analysisResult.details?.hasRiskAssessment || false,
       HasPeriodicReview: analysisResult.details?.hasPeriodicReview || false,
       StructureScore: analysisResult.details?.summary?.structureScore || 0,
       GovernanceScore: analysisResult.details?.summary?.governanceScore || 0,
       
       // Upload metadata
       UploadedBy: formData.primary_owner,
       UploadedAt: new Date().toISOString(),
       Status: 'Active',
       SharePointUploaded: true
     };
     
     const procedureResult = await this.createProcedureListItem(procedureData, requestDigest);
     
     // 5. Create comprehensive audit log entry
     await this.createAuditLogEntry({
       __metadata: { type: 'SP.Data.AuditLogListItem' },
       Title: `Procedure Created: ${formData.name}`,
       ActionType: 'CREATE',
       UserId: formData.primary_owner,
       LogTimestamp: new Date().toISOString(),
       Details: JSON.stringify({
         procedureId: procedureResult.Id,
         procedureName: formData.name,
         lob: formData.lob,
         subsection: formData.procedure_subsection,
         qualityScore: analysisResult.score,
         templateCompliance: analysisResult.details?.summary?.templateCompliance,
         riskRating: analysisResult.details?.riskRating,
         periodicReview: analysisResult.details?.periodicReview,
         documentOwners: analysisResult.details?.owners,
         foundElements: analysisResult.details?.foundElements?.length,
         missingElements: analysisResult.details?.missingElements?.length,
         fileSize: file.size,
         fileName: file.name,
         sharePointPath: sharePointPath
       }),
       ProcedureId: procedureResult.Id,
       LOB: formData.lob
     }, requestDigest);

     const sharePointUrl = `${sharePointPaths.baseSite}/${sharePointPath}/${file.name}`;
     
     console.log('🎉 Procedure upload completed successfully:', {
       procedureId: procedureResult.Id,
       qualityScore: analysisResult.score,
       sharePointUrl
     });

     return {
       success: true,
       procedureId: procedureResult.Id,
       qualityScore: analysisResult.score,
       templateCompliance: analysisResult.details?.summary?.templateCompliance,
       sharePointPath: sharePointPath,
       sharePointUrl: sharePointUrl,
       analysisResult: analysisResult
     };
     
   } catch (error) {
     console.error('❌ Upload procedure failed:', error);
     throw new Error(`Upload failed: ${error.message}`);
   }
 }

 async getRequestDigest() {
   try {
     const response = await fetch(`${sharePointPaths.baseSite}/_api/contextinfo`, {
       method: 'POST',
       headers: {
         'Accept': 'application/json; odata=verbose',
         'Content-Type': 'application/json; odata=verbose'
       }
     });

     if (!response.ok) {
       throw new Error(`Failed to get SharePoint context: ${response.status}`);
     }

     const data = await response.json();
     return data.d.GetContextWebInformation.FormDigestValue;
     
   } catch (error) {
     throw new Error(`Failed to get SharePoint request digest: ${error.message}`);
   }
 }

 async uploadFileToSharePoint(file, sharePointPath, requestDigest) {
   try {
     const uploadUrl = sharePointPaths.getUploadUrl(sharePointPaths.baseSite.split('/').pop(), sharePointPath, file.name);
     
     const response = await fetch(uploadUrl, {
       method: 'POST',
       headers: {
         'Accept': 'application/json; odata=verbose',
         'X-RequestDigest': requestDigest,
         'Content-Type': 'application/octet-stream'
       },
       body: file
     });

     if (!response.ok) {
       const errorText = await response.text();
       throw new Error(`SharePoint file upload failed: ${response.status} - ${errorText}`);
     }

     const result = await response.json();
     
     console.log('✅ File uploaded to SharePoint:', result.d.ServerRelativeUrl);
     
     return {
       serverRelativeUrl: result.d.ServerRelativeUrl,
       webUrl: `${sharePointPaths.baseSite}/${sharePointPath}/${file.name}`
     };
     
   } catch (error) {
     throw new Error(`File upload to SharePoint failed: ${error.message}`);
   }
 }

 async createProcedureListItem(procedureData, requestDigest) {
   try {
     const response = await fetch(
       `${sharePointPaths.baseSite}/_api/web/lists/getbytitle('Procedures')/items`,
       {
         method: 'POST',
         headers: {
           'Accept': 'application/json; odata=verbose',
           'Content-Type': 'application/json; odata=verbose',
           'X-RequestDigest': requestDigest
         },
         body: JSON.stringify(procedureData)
       }
     );

     if (!response.ok) {
       const errorText = await response.text();
       throw new Error(`Failed to create procedure list item: ${response.status} - ${errorText}`);
     }

     const result = await response.json();
     console.log('✅ Procedure created in SharePoint List:', result.d.Id);
     
     return result.d;
     
   } catch (error) {
     throw new Error(`Failed to create procedure list item: ${error.message}`);
   }
 }

 async createAuditLogEntry(auditData, requestDigest) {
   try {
     const response = await fetch(
       `${sharePointPaths.baseSite}/_api/web/lists/getbytitle('AuditLog')/items`,
       {
         method: 'POST',
         headers: {
           'Accept': 'application/json; odata=verbose',
           'Content-Type': 'application/json; odata=verbose',
           'X-RequestDigest': requestDigest
         },
         body: JSON.stringify(auditData)
       }
     );

     if (response.ok) {
       console.log('✅ Audit log entry created');
       return await response.json();
     } else {
       console.warn('⚠️ Failed to create audit log entry, but continuing...');
       return null;
     }
     
   } catch (error) {
     console.warn('⚠️ Audit log creation failed:', error.message);
     return null; // Don't fail the whole process for audit log
   }
 }
}

export default DocumentAnalyzer;
