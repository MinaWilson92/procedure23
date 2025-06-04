// config/paths.js - SharePoint Path Configuration
export const sharePointPaths = {
  // Base SharePoint site (using your actual endpoint)
  baseSite: 'https://teams.global.hsbc/sites/EmployeeEng',
  
  // Site Assets path (as you specified)
  siteAssetsBase: 'SiteAssets',
  
  // LOB-specific folder mapping
  lobFolders: {
    'IWPB': {
      name: 'International Wealth and Premier Banking',
      baseFolder: 'PrIWPB',
      subFolders: {
        'risk_management': 'Risk Management',
        'compliance': 'Compliance & Regulatory',
        'operational': 'Operational Procedures',
        'financial': 'Financial Controls',
        'technology': 'Technology & Security'
      }
    },
    'CIB': {
      name: 'Commercial and Institutional Banking',
      baseFolder: 'PrCIB',
      subFolders: {
        'trading': 'Trading Operations',
        'sales': 'Sales Procedures',
        'research': 'Research & Analysis',
        'credit': 'Credit Management'
      }
    },
    'GCOO': {
      name: 'Group Chief Operating Officer',
      baseFolder: 'PrGCOO',
      subFolders: {
        'operations': 'Operations',
        'technology': 'Technology',
        'change_management': 'Change Management',
        'project_management': 'Project Management'
      }
    }
  },
  
  // Generate SharePoint folder path: SiteAssets/PrIWPB/Risk Management
  getSharePointPath: (lob, subsection) => {
    const lobConfig = sharePointPaths.lobFolders[lob];
    if (!lobConfig) {
      throw new Error(`Unknown LOB: ${lob}`);
    }
    
    const subFolder = lobConfig.subFolders[subsection];
    if (!subFolder) {
      throw new Error(`Unknown subsection: ${subsection} for LOB: ${lob}`);
    }
    
    return `${sharePointPaths.siteAssetsBase}/${lobConfig.baseFolder}/${subFolder}`;
  },
  
  // Generate SharePoint upload URL using correct API format
  getUploadUrl: (lob, subsection, filename) => {
    const relativePath = sharePointPaths.getSharePointPath(lob, subsection);
    return `${sharePointPaths.baseSite}/_api/web/GetFolderByServerRelativeUrl('/sites/EmployeeEng/${relativePath}')/Files/add(url='${filename}',overwrite=true)`;
  },
  
  // Get folder creation URL
  getFolderCreationUrl: (lob, subsection) => {
    const lobConfig = sharePointPaths.lobFolders[lob];
    const relativePath = `/sites/EmployeeEng/${sharePointPaths.siteAssetsBase}/${lobConfig.baseFolder}`;
    return `${sharePointPaths.baseSite}/_api/web/folders/add('${relativePath}/${lobConfig.subFolders[subsection]}')`;
  },
  
  // Check if folder exists
  getFolderCheckUrl: (lob, subsection) => {
    const relativePath = sharePointPaths.getSharePointPath(lob, subsection);
    return `${sharePointPaths.baseSite}/_api/web/GetFolderByServerRelativeUrl('/sites/EmployeeEng/${relativePath}')`;
  }
};

// Export individual functions for easier use
export const getSharePointPath = sharePointPaths.getSharePointPath;
export const getUploadUrl = sharePointPaths.getUploadUrl;
export const getFolderCreationUrl = sharePointPaths.getFolderCreationUrl;

export default sharePointPaths;
