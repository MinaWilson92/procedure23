// services/documentAnalysis.js - Document analysis service

const fs = require('fs');
const mammoth = require('mammoth');
const pdfParse = require('pdf-parse');
const config = require('../config/config');

// Helper functions for document analysis
function isValidOwnerName(name) {
  if (!name || name.length < 2 || name.length > 100) return false;
  
  // Remove common noise patterns
  const excludePatterns = [
    /last\s+updated?\s+date/gi,
    /sign[\s-]*off\s+date/gi,
    /effective\s+date/gi,
    /expiry\s+date/gi,
    /version\s+\d+/gi,
    /table\s+of\s+contents/gi,
    /page\s+\d+/gi,
    /^\d+$/,  // Numbers only
    /^[^a-zA-Z]*$/  // No letters
  ];
  
  for (const pattern of excludePatterns) {
    if (pattern.test(name)) return false;
  }

  // Must contain at least one letter
  if (!/[a-zA-Z]/.test(name)) return false;

  // Filter out common non-name terms
  const lowerName = name.toLowerCase().trim();
  const excludeWords = [
    'name', 'role', 'position', 'department', 'date', 'sign-off', 
    'version', 'control', 'table', 'header', 'title', 'section',
    'last updated', 'current', 'previous', 'next', 'tbd', 'tba',
    'pending', 'draft', 'final', 'approved', 'n/a', 'none'
  ];
  
  if (excludeWords.some(word => lowerName === word || lowerName.includes(word))) {
    return false;
  }

  // Should look like a name (has space or multiple words)
  const words = lowerName.split(/\s+/).filter(word => word.length >= 2);
  if (words.length >= 1 && words.every(word => /^[a-zA-Z\s\-\.]+$/.test(word))) {
    return true;
  }

  return false;
}

function isValidDate(dateStr) {
  if (!dateStr || dateStr.length < 5) return false;
  
  // Clean up the date string
  const cleanDate = dateStr.trim().replace(/[^\w\s\/\-\.]/g, '');
  
  const datePatterns = [
    /\d{1,2}[\s\/\-\.]\d{1,2}[\s\/\-\.]\d{2,4}/,
    /\d{4}[\s\/\-\.]\d{1,2}[\s\/\-\.]\d{1,2}/,
    /\d{1,2}\s+(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\s+\d{4}/i,
    /(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\s+\d{1,2},?\s+\d{4}/i
  ];
  
  for (const pattern of datePatterns) {
    if (pattern.test(cleanDate)) {
      try {
        const parsed = new Date(cleanDate);
        if (!isNaN(parsed.getTime()) && 
            parsed.getFullYear() > 1990 && 
            parsed.getFullYear() < 2040) {
          return true;
        }
      } catch (e) {
        continue;
      }
    }
  }
  
  return false;
}

// Enhanced document analysis function with AI recommendations
async function analyzeDocument(filePath, mimetype) {
  const analysis = {
    score: 0,
    details: {
      hasTableOfContents: false,
      hasDocumentControl: false,
      hasOwners: false,
      hasSignOffDates: false,
      hasRiskAssessment: false,
      riskScore: null,
      riskRating: null,
      owners: [],
      signOffDates: [],
      departments: [],
      roles: [],
      missingElements: [],
      foundElements: [],
      summary: {}
    },
    aiRecommendations: []
  };

  try {
    let text = '';
    
    console.log('📄 Starting document analysis for:', filePath);
    
    // Extract text from document
    if (mimetype === 'application/pdf') {
      const dataBuffer = fs.readFileSync(filePath);
      const data = await pdfParse(dataBuffer);
      text = data.text;
      console.log('✅ PDF text extracted, length:', text.length);
    } else if (
      mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
      mimetype === 'application/msword'
    ) {
      const textResult = await mammoth.extractRawText({ path: filePath });
      text = textResult.value;
      console.log('✅ Word document text extracted, length:', text.length);
    } else {
      throw new Error('Unsupported file type: ' + mimetype);
    }

    if (!text || text.trim().length === 0) {
      throw new Error('No text content could be extracted from the document');
    }

    const lowerText = text.toLowerCase();
    let score = 0;

    // Enhanced section detection with weighted scoring
    const sectionChecks = config.QUALITY_WEIGHTS;
    
    const actualChecks = {
      'Table of Contents': {
        found: /table\s+of\s+contents|contents\s+page|^contents$|index$/mi.test(text),
        ...sectionChecks['Table of Contents']
      },
      'Purpose': {
        found: /purpose|objectives?|aims?/i.test(text),
        ...sectionChecks['Purpose']
      },
      'Scope': {
        found: /scope|applies?\s+to|coverage/i.test(text),
        ...sectionChecks['Scope']
      },
      'Document Control': {
        found: /document\s+control|version\s+control|document\s+management|revision\s+history/i.test(text),
        ...sectionChecks['Document Control']
      },
      'Responsibilities': {
        found: /responsibilities|responsible\s+parties?|accountable|raci/i.test(text),
        ...sectionChecks['Responsibilities']
      },
      'Procedures': {
        found: /procedure|process|step|workflow|method/i.test(text) && text.length > 1000,
        ...sectionChecks['Procedures']
      },
      'Risk Assessment': {
        found: /risk\s+assessment|risk\s+analysis|risk\s+management|risk\s+matrix/i.test(text),
        ...sectionChecks['Risk Assessment']
      },
      'Approval': {
        found: /approval|approved\s+by|sign[\s-]*off|authorized/i.test(text),
        ...sectionChecks['Approval']
      },
      'Review Date': {
        found: /review\s+date|next\s+review|review\s+frequency/i.test(text),
        ...sectionChecks['Review Date']
      }
    };

    // Calculate weighted score and generate recommendations
    let totalWeight = 0;
    let achievedWeight = 0;
    
    Object.entries(actualChecks).forEach(([name, check]) => {
      totalWeight += check.weight;
      if (check.found) {
        achievedWeight += check.weight;
        analysis.details.foundElements.push(name);
      } else {
        analysis.details.missingElements.push(name);
        
        // Generate AI recommendation for missing elements
        analysis.aiRecommendations.push({
          type: 'missing_section',
          priority: check.priority,
          message: `Add a ${name} section: ${check.description || `Essential ${name.toLowerCase()} information`}`,
          impact: `+${check.weight} points`,
          category: 'Structure'
        });
      }
    });

    score = Math.round((achievedWeight / totalWeight) * 100);

    // Update specific analysis flags
    analysis.details.hasTableOfContents = actualChecks['Table of Contents'].found;
    analysis.details.hasDocumentControl = actualChecks['Document Control'].found;
    analysis.details.hasRiskAssessment = actualChecks['Risk Assessment'].found;

    console.log('📊 Section analysis completed:', {
      foundSections: analysis.details.foundElements.length,
      missingSections: analysis.details.missingElements.length,
      baseScore: score
    });

    // Enhanced owner extraction with better patterns
    const ownerPatterns = [
      /(?:document\s+)?owner[s]?\s*[:：]\s*([^\n\r\t,;]+)/gi,
      /(?:procedure\s+)?owner[s]?\s*[:：]\s*([^\n\r\t,;]+)/gi,
      /prepared\s+by\s*[:：]\s*([^\n\r\t,;]+)/gi,
      /authored\s+by\s*[:：]\s*([^\n\r\t,;]+)/gi,
      /responsible\s*[:：]\s*([^\n\r\t,;]+)/gi,
      /accountable\s*[:：]\s*([^\n\r\t,;]+)/gi,
      /created\s+by\s*[:：]\s*([^\n\r\t,;]+)/gi,
      /maintained\s+by\s*[:：]\s*([^\n\r\t,;]+)/gi
    ];
    
    const foundOwners = new Set();
    ownerPatterns.forEach(pattern => {
      const matches = text.matchAll(pattern);
      for (const match of matches) {
        const owner = match[1].trim();
        if (isValidOwnerName(owner)) {
          foundOwners.add(owner);
        }
      }
    });

    analysis.details.owners = Array.from(foundOwners);
    analysis.details.hasOwners = analysis.details.owners.length > 0;

    // Enhanced date extraction
    const datePatterns = [
      /(?:review|approval|effective|expiry|next\s+review|last\s+updated?)\s*date\s*[:：]\s*([^\n\r]+)/gi,
      /(\d{1,2}[\s\/\-\.]\d{1,2}[\s\/\-\.]\d{2,4})/g,
      /(\d{4}[\s\/\-\.]\d{1,2}[\s\/\-\.]\d{1,2})/g,
      /(\d{1,2}\s+(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\s+\d{4})/gi,
      /((?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\s+\d{1,2},?\s+\d{4})/gi
    ];
    
    const foundDates = new Set();
    datePatterns.forEach(pattern => {
      const matches = text.matchAll(pattern);
      for (const match of matches) {
        const date = match[1].trim();
        if (isValidDate(date)) {
          foundDates.add(date);
        }
      }
    });

    analysis.details.signOffDates = Array.from(foundDates);
    analysis.details.hasSignOffDates = analysis.details.signOffDates.length > 0;

    // Risk assessment scoring
    if (analysis.details.hasRiskAssessment) {
      const riskKeywords = [
        'high risk', 'medium risk', 'low risk',
        'risk score', 'risk level', 'risk rating',
        'critical', 'moderate', 'minimal', 'severe',
        'probability', 'impact', 'likelihood'
      ];
      
      let riskScore = 0;
      riskKeywords.forEach(keyword => {
        const matches = (text.toLowerCase().match(new RegExp(keyword, 'g')) || []).length;
        riskScore += matches;
      });
      
      analysis.details.riskScore = riskScore;
      analysis.details.riskRating = riskScore > 5 ? 'High' : riskScore > 2 ? 'Medium' : 'Low';
    }

    // Extract departments and roles
    const departmentPatterns = [
      /department[s]?\s*[:：]\s*([^\n\r\t,;]+)/gi,
      /division[s]?\s*[:：]\s*([^\n\r\t,;]+)/gi,
      /unit[s]?\s*[:：]\s*([^\n\r\t,;]+)/gi,
      /team[s]?\s*[:：]\s*([^\n\r\t,;]+)/gi
    ];
    
    const foundDepartments = new Set();
    departmentPatterns.forEach(pattern => {
      const matches = text.matchAll(pattern);
      for (const match of matches) {
        const dept = match[1].trim();
        if (dept.length > 2 && dept.length < 100) {
          foundDepartments.add(dept);
        }
      }
    });
    
    analysis.details.departments = Array.from(foundDepartments);

    // Extract roles
    const roleKeywords = [
      'manager', 'director', 'officer', 'analyst', 'specialist',
      'coordinator', 'supervisor', 'administrator', 'executive',
      'associate', 'senior', 'junior', 'lead', 'head'
    ];
    
    const foundRoles = new Set();
    roleKeywords.forEach(role => {
      const matches = text.toLowerCase().match(new RegExp(`\\b${role}\\b`, 'g')) || [];
      if (matches.length > 0) {
        foundRoles.add(role);
      }
    });
    
    analysis.details.roles = Array.from(foundRoles);

    // Document quality bonuses and penalties
    const documentLength = text.length;
    
    if (documentLength < 500) {
      score = Math.max(0, score - 30);
      analysis.aiRecommendations.push({
        type: 'content_length',
        priority: 'HIGH',
        message: 'Document appears too short for a comprehensive procedure. Consider adding more detail and examples.',
        impact: '-30 points',
        category: 'Content Quality'
      });
    } else if (documentLength > 20000) {
      analysis.aiRecommendations.push({
        type: 'content_optimization',
        priority: 'MEDIUM',
        message: 'Document is very long. Consider breaking into smaller, focused procedures for better usability.',
        impact: 'Usability Impact',
        category: 'Structure'
      });
    }

    // Structure bonuses
    if (analysis.details.hasRiskAssessment && analysis.details.hasDocumentControl) {
      score = Math.min(100, score + 10);
      analysis.aiRecommendations.push({
        type: 'structure_bonus',
        priority: 'LOW',
        message: 'Excellent document structure with both risk assessment and document control sections.',
        impact: '+10 points',
        category: 'Quality Bonus'
      });
    }

    // Content depth analysis
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 10);
    const paragraphs = text.split(/\n\s*\n/).filter(p => p.trim().length > 50);
    
    if (sentences.length < 20) {
      analysis.aiRecommendations.push({
        type: 'content_depth',
        priority: 'MEDIUM',
        message: 'Document may lack sufficient detail. Consider adding more comprehensive explanations.',
        impact: 'Content Quality',
        category: 'Content Quality'
      });
    }

    // Owner validation recommendations
    if (analysis.details.owners.length === 0) {
      analysis.aiRecommendations.push({
        type: 'governance',
        priority: 'HIGH',
        message: 'No document owners identified. Add clear ownership information with names and roles for accountability.',
        impact: 'Compliance Risk',
        category: 'Governance'
      });
    } else if (analysis.details.owners.length === 1) {
      analysis.aiRecommendations.push({
        type: 'governance',
        priority: 'MEDIUM',
        message: 'Consider adding a secondary owner for better governance, continuity, and backup coverage.',
        impact: 'Risk Mitigation',
        category: 'Governance'
      });
    } else {
      analysis.aiRecommendations.push({
        type: 'governance',
        priority: 'LOW',
        message: 'Good ownership structure with multiple stakeholders identified.',
        impact: 'Best Practice',
        category: 'Governance'
      });
    }

    // Date validation recommendations
    if (analysis.details.signOffDates.length === 0) {
      analysis.aiRecommendations.push({
        type: 'compliance',
        priority: 'HIGH',
        message: 'No sign-off or review dates found. Add approval dates, effective dates, and next review schedule.',
        impact: 'Compliance Risk',
        category: 'Compliance'
      });
    }

    // Technical quality checks
    const hasNumberedSteps = /\d+\.\s+/.test(text);
    const hasBulletPoints = /[•\-\*]\s+/.test(text);
    
    if (!hasNumberedSteps && !hasBulletPoints) {
      analysis.aiRecommendations.push({
        type: 'formatting',
        priority: 'MEDIUM',
        message: 'Consider using numbered steps or bullet points to improve readability and usability.',
        impact: 'Usability',
        category: 'Formatting'
      });
    }

    // Final score adjustment
    analysis.score = Math.max(0, Math.min(100, score));

    // Generate comprehensive summary
    analysis.details.summary = {
      totalElements: Object.keys(actualChecks).length,
      foundElements: analysis.details.foundElements.length,
      missingElements: analysis.details.missingElements.length,
      documentLength: documentLength,
      hasStructure: analysis.details.hasTableOfContents,
      hasGovernance: analysis.details.hasDocumentControl,
      qualityLevel: analysis.score >= 80 ? 'High' : analysis.score >= 60 ? 'Medium' : 'Low',
      tablesFound: (text.match(/\|.*\|/g) || []).length,
      hasStructuredDocControl: /version\s*[:：]\s*\d+/i.test(text),
      ownersFound: analysis.details.owners.length,
      datesFound: analysis.details.signOffDates.length,
      departmentsFound: analysis.details.departments.length,
      rolesFound: analysis.details.roles.length,
      sentenceCount: sentences.length,
      paragraphCount: paragraphs.length,
      hasNumberedSteps: hasNumberedSteps,
      hasBulletPoints: hasBulletPoints
    };

    // Sort recommendations by priority (HIGH > MEDIUM > LOW)
    const priorityOrder = { 'HIGH': 3, 'MEDIUM': 2, 'LOW': 1 };
    analysis.aiRecommendations.sort((a, b) => {
      return priorityOrder[b.priority] - priorityOrder[a.priority];
    });

    console.log('✅ Enhanced document analysis completed:', {
      score: analysis.score,
      foundElements: analysis.details.foundElements.length,
      missingElements: analysis.details.missingElements.length,
      aiRecommendations: analysis.aiRecommendations.length,
      qualityLevel: analysis.details.summary.qualityLevel,
      documentLength: documentLength,
      ownersFound: analysis.details.owners.length,
      datesFound: analysis.details.signOffDates.length
    });

  } catch (err) {
    console.error('❌ Error in document analysis:', err);
    analysis.details.error = err.message;
    analysis.score = 0;
    analysis.aiRecommendations.push({
      type: 'analysis_error',
      priority: 'HIGH',
      message: `Document analysis failed: ${err.message}. Please check the file format and try again.`,
      impact: 'Score: 0',
      category: 'System Error'
    });
  }

  return analysis;
}

module.exports = {
  analyzeDocument,
  isValidOwnerName,
  isValidDate
};