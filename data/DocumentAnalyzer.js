// services/DocumentAnalyzer.js - Client-Side AI Analysis Service
class DocumentAnalyzer {
  constructor() {
    this.apiBaseUrl = '/ProceduresHubEG6/api';
    this.minimumScore = 80;
    
    // LOB subsection configuration
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

  // Get available subsections for a LOB
  getSubsections(lob) {
    return this.lobSubsections[lob] || [];
  }

  // Validate file before upload
  validateFile(file) {
    const allowedTypes = [
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/msword'
    ];
    
    if (!allowedTypes.includes(file.type)) {
      throw new Error('Please select a PDF or Word document (.pdf, .docx, .doc)');
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      throw new Error('File size must be less than 10MB');
    }

    return true;
  }

  // AI Document Analysis
  async analyzeDocument(file, metadata = {}) {
    try {
      console.log('🔍 Starting AI document analysis...');
      
      const formData = new FormData();
      formData.append('file', file);
      formData.append('name', metadata.name || '');
      formData.append('lob', metadata.lob || '');
      formData.append('subsection', metadata.subsection || '');

      const response = await fetch(`${this.apiBaseUrl}/analyze-document`, {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `Analysis failed: ${response.status}`);
      }

      const analysisResult = await response.json();
      
      // Add acceptance criteria
      analysisResult.accepted = analysisResult.score >= this.minimumScore;
      
      console.log('✅ AI analysis completed:', {
        score: analysisResult.score,
        accepted: analysisResult.accepted,
        foundElements: analysisResult.details?.foundElements?.length || 0
      });

      return analysisResult;
      
    } catch (error) {
      console.error('❌ AI analysis failed:', error);
      throw new Error(`Document analysis failed: ${error.message}`);
    }
  }

  // Upload procedure with analysis to SharePoint
  async uploadProcedureWithAnalysis(formData, file) {
    try {
      console.log('🚀 Starting procedure upload with AI analysis...');
      
      const uploadData = new FormData();
      
      // Add file
      uploadData.append('file', file);
      
      // Add all form fields
      Object.keys(formData).forEach(key => {
        if (formData[key] !== null && formData[key] !== undefined && key !== 'file') {
          uploadData.append(key, formData[key]);
        }
      });

      const response = await fetch(`${this.apiBaseUrl}/upload-procedure`, {
        method: 'POST',
        body: uploadData
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `Upload failed: ${response.status}`);
      }

      const result = await response.json();
      
      console.log('✅ Procedure uploaded successfully:', {
        procedureId: result.procedureId,
        sharePointPath: result.sharePointPath
      });

      return result;
      
    } catch (error) {
      console.error('❌ Procedure upload failed:', error);
      throw new Error(`Upload failed: ${error.message}`);
    }
  }
}

export default DocumentAnalyzer;
