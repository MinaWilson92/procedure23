// services/documentAnalysis.js - Pure HSBC AI Analysis Functions
// ✅ No imports needed - pure JavaScript functions for SharePoint CDN

// ============================================================================
// ENHANCED DOCUMENT ANALYSIS SERVICE FOR HSBC TEMPLATE
// ============================================================================

async function analyzeDocument(text, mimetype, metadata = {}) {
  const analysis = {
    score: 0,
    details: {
      hasTableOfContents: false,
      hasDocumentControl: false,
      hasOwners: false,
      hasSignOffDates: false,
      hasRiskAssessment: false,
      hasPeriodicReview: false,
      riskScore: null,
      riskRating: null,
      periodicReview: null,
      owners: [],
      signOffDates: [],
      departments: [],
      roles: [],
      missingElements: [],
      foundElements: [],
      summary: {},
      extractedData: {
        documentControlTable: null,
        riskDetails: null,
        reviewFrequency: null,
        definitions: [],
        governance: null
      },
      structuredStatus: {}
    },
    aiRecommendations: []
  };

  try {
    console.log('📄 Starting enhanced HSBC template analysis for document...');
    
    if (!text || text.trim().length === 0) {
      throw new Error('No text content could be extracted from the document');
    }

    const lowerText = text.toLowerCase();
    let score = 0;

    // ============================================================================
    // HSBC TEMPLATE SPECIFIC ANALYSIS
    // ============================================================================

    console.log('🔍 Starting HSBC template-specific analysis...');

    // 1. DOCUMENT CONTROL TABLE ANALYSIS
    const documentControlAnalysis = analyzeDocumentControlTable(text);
    if (documentControlAnalysis.found) {
      analysis.details.hasDocumentControl = true;
      analysis.details.hasOwners = documentControlAnalysis.owners.length > 0;
      analysis.details.owners = documentControlAnalysis.owners;
      analysis.details.hasSignOffDates = documentControlAnalysis.signOffDates.length > 0;
      analysis.details.signOffDates = documentControlAnalysis.signOffDates;
      analysis.details.departments = documentControlAnalysis.departments;
      analysis.details.extractedData.documentControlTable = documentControlAnalysis;
      analysis.details.foundElements.push('Document Control Table');
      score += 25; // High weight for document control
      
      console.log('✅ Document Control Table found:', {
        owners: documentControlAnalysis.owners,
        signOffDates: documentControlAnalysis.signOffDates
      });
    } else {
      analysis.details.missingElements.push('Document Control Table');
      analysis.aiRecommendations.push({
        type: 'document_control',
        priority: 'HIGH',
        message: 'Add a Document Control table with Version, Role, Name, Position/Department, and Sign-off Date columns',
        impact: '+25 points',
        category: 'Governance'
      });
    }

    // 2. RISK ASSESSMENT ANALYSIS (HSBC specific)
    const riskAnalysis = analyzeHSBCRiskAssessment(text);
    if (riskAnalysis.found) {
      analysis.details.hasRiskAssessment = true;
      analysis.details.riskScore = riskAnalysis.score;
      analysis.details.riskRating = riskAnalysis.rating;
      analysis.details.extractedData.riskDetails = riskAnalysis;
      analysis.details.foundElements.push(`Risk Assessment (${riskAnalysis.rating})`);
      score += 20;
      
      console.log('✅ Risk Assessment found:', {
        rating: riskAnalysis.rating,
        score: riskAnalysis.score,
        details: riskAnalysis.details
      });
    } else {
      analysis.details.missingElements.push('Risk Assessment');
      analysis.aiRecommendations.push({
        type: 'risk_assessment',
        priority: 'HIGH',
        message: 'Add a Risk-based rating section with specific risk level (High/Medium/Low)',
        impact: '+20 points',
        category: 'Risk Management'
      });
    }

    // 3. PERIODIC REVIEW ANALYSIS
    const reviewAnalysis = analyzePeriodicReview(text);
    if (reviewAnalysis.found) {
      analysis.details.hasPeriodicReview = true;
      analysis.details.periodicReview = reviewAnalysis.frequency;
      analysis.details.extractedData.reviewFrequency = reviewAnalysis;
      analysis.details.foundElements.push(`Periodic Review (${reviewAnalysis.frequency})`);
      score += 15;
      
      console.log('✅ Periodic Review found:', {
        frequency: reviewAnalysis.frequency,
        details: reviewAnalysis.details
      });
    } else {
      analysis.details.missingElements.push('Periodic Review Schedule');
      analysis.aiRecommendations.push({
        type: 'periodic_review',
        priority: 'MEDIUM',
        message: 'Add an "Approved Periodic Review" section with review frequency (Annually, Bi-annually, etc.)',
        impact: '+15 points',
        category: 'Governance'
      });
    }

    // 4. HSBC DEFINITIONS SECTION
    const definitionsAnalysis = analyzeDefinitionsSection(text);
    if (definitionsAnalysis.found) {
      analysis.details.extractedData.definitions = definitionsAnalysis.definitions;
      analysis.details.foundElements.push(`Definitions (${definitionsAnalysis.definitions.length} terms)`);
      score += 10;
      
      console.log('✅ Definitions section found:', {
        count: definitionsAnalysis.definitions.length,
        terms: definitionsAnalysis.definitions.slice(0, 3) // Show first 3
      });
    } else {
      analysis.details.missingElements.push('Definitions Section');
      analysis.aiRecommendations.push({
        type: 'definitions',
        priority: 'MEDIUM',
        message: 'Add a Definitions section explaining key terms and abbreviations (LP, OI, PPPO, SMEs)',
        impact: '+10 points',
        category: 'Structure'
      });
    }

    // 5. GOVERNANCE SECTION ANALYSIS
    const governanceAnalysis = analyzeGovernanceSection(text);
    if (governanceAnalysis.found) {
      analysis.details.extractedData.governance = governanceAnalysis;
      analysis.details.foundElements.push('Governance of Document');
      score += 15;
      
      console.log('✅ Governance section found:', governanceAnalysis.details);
    } else {
      analysis.details.missingElements.push('Governance of this Document');
      analysis.aiRecommendations.push({
        type: 'governance',
        priority: 'HIGH',
        message: 'Add a "Governance of this Document" section explaining review responsibilities and compliance requirements',
        impact: '+15 points',
        category: 'Governance'
      });
    }

    // 6. TRIGGERS FOR DOCUMENT UPDATE/CHANGE
    const triggersAnalysis = analyzeUpdateTriggers(text);
    if (triggersAnalysis.found) {
      analysis.details.foundElements.push(`Update Triggers (${triggersAnalysis.triggers.length} identified)`);
      score += 10;
      
      console.log('✅ Update triggers found:', triggersAnalysis.triggers);
    } else {
      analysis.details.missingElements.push('Triggers for Document Update/Change');
      analysis.aiRecommendations.push({
        type: 'update_triggers',
        priority: 'MEDIUM',
        message: 'Add a section listing triggers for document updates (policy changes, regulatory changes, etc.)',
        impact: '+10 points',
        category: 'Change Management'
      });
    }

    // 7. STANDARD HSBC SECTIONS CHECK
    const standardSections = [
      { name: 'Table of Contents', pattern: /table\s+of\s+contents|contents/i, weight: 5 },
      { name: 'Purpose', pattern: /purpose|objectives?|aims?/i, weight: 5 },
      { name: 'Scope', pattern: /scope|applies?\s+to|coverage/i, weight: 5 },
      { name: 'Procedures', pattern: /procedure|process|step|workflow|method/i, weight: 10 }
    ];

    standardSections.forEach(section => {
      if (section.pattern.test(text)) {
        analysis.details.foundElements.push(section.name);
        score += section.weight;
      } else {
        analysis.details.missingElements.push(section.name);
        analysis.aiRecommendations.push({
          type: 'missing_section',
          priority: 'MEDIUM',
          message: `Add a ${section.name} section to improve document structure`,
          impact: `+${section.weight} points`,
          category: 'Structure'
        });
      }
    });

    // ============================================================================
    // QUALITY SCORING AND FINAL ANALYSIS
    // ============================================================================
    
    // Build structured status for UI
    analysis.details.structuredStatus = {
      documentOwners: {
        found: analysis.details.owners.length > 0,
        value: analysis.details.owners
      },
      signOffDates: {
        found: analysis.details.signOffDates.length > 0,
        value: analysis.details.signOffDates
      },
      departments: {
        found: analysis.details.departments.length > 0,
        value: analysis.details.departments
      },
      riskRating: {
        found: !!analysis.details.riskRating,
        value: analysis.details.riskRating
      },
      periodicReview: {
        found: !!analysis.details.periodicReview,
        value: analysis.details.periodicReview
      }
    };

    // Inject AI Recommendations if critical fields are missing
    const criticalFields = [
      { key: 'documentOwners', label: 'Document Owners' },
      { key: 'signOffDates', label: 'Sign-off Dates' },
      { key: 'departments', label: 'Departments' },
      { key: 'riskRating', label: 'Risk Rating' },
      { key: 'periodicReview', label: 'Periodic Review' }
    ];

    criticalFields.forEach(field => {
      const entry = analysis.details.structuredStatus[field.key];
      if (!entry?.found) {
        analysis.aiRecommendations.push({
          type: 'missing_' + field.key.toLowerCase(),
          priority: 'HIGH',
          message: `Critical element missing: ${field.label}. Please ensure it is included and clearly labeled in the document.`,
          impact: '-15 points',
          category: 'Document Completeness'
        });
      }
    });

    // Cap the score at 100
    analysis.score = Math.min(100, score);

    // Generate comprehensive summary
    analysis.details.summary = {
      templateCompliance: analysis.score >= 80 ? 'High' : analysis.score >= 60 ? 'Medium' : 'Low',
      documentType: 'HSBC Local Procedure',
      foundElements: analysis.details.foundElements.length,
      missingElements: analysis.details.missingElements.length,
      hasMinimumGovernance: analysis.details.hasDocumentControl && analysis.details.hasOwners,
      hasRiskManagement: analysis.details.hasRiskAssessment,
      hasReviewProcess: analysis.details.hasPeriodicReview,
      structureScore: Math.round((analysis.details.foundElements.length / (analysis.details.foundElements.length + analysis.details.missingElements.length)) * 100),
      governanceScore: (analysis.details.hasDocumentControl ? 50 : 0) + (analysis.details.hasRiskAssessment ? 30 : 0) + (analysis.details.hasPeriodicReview ? 20 : 0),
      recommendations: analysis.aiRecommendations.length
    };

    // Add specific HSBC template recommendations
    if (analysis.score < 80) {
      analysis.aiRecommendations.push({
        type: 'hsbc_template_compliance',
        priority: 'HIGH',
        message: 'Document does not meet HSBC template standards. Ensure all mandatory sections are included.',
        impact: 'Compliance Risk',
        category: 'Template Compliance'
      });
    }

    // Sort recommendations by priority
    const priorityOrder = { 'HIGH': 3, 'MEDIUM': 2, 'LOW': 1 };
    analysis.aiRecommendations.sort((a, b) => {
      return priorityOrder[b.priority] - priorityOrder[a.priority];
    });

    console.log('✅ Enhanced HSBC template analysis completed:', {
      score: analysis.score,
      foundElements: analysis.details.foundElements.length,
      missingElements: analysis.details.missingElements.length,
      templateCompliance: analysis.details.summary.templateCompliance,
      ownersFound: analysis.details.owners.length,
      riskRating: analysis.details.riskRating,
      reviewFrequency: analysis.details.periodicReview
    });

  } catch (err) {
    console.error('❌ Error in enhanced document analysis:', err);
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

// ============================================================================
// HSBC TEMPLATE SPECIFIC ANALYSIS FUNCTIONS
// ============================================================================

function analyzeDocumentControlTable(text) {
  console.log('🔍 Enhanced parsing of Document Control table...');

  const analysis = {
    found: false,
    owners: [],
    signOffDates: [],
    roles: [],
    departments: [],
    versions: []
  };

  // Try to find the Document Control block (case-insensitive)
  const controlSectionMatch = text.match(/1\.\s*Document Control([\s\S]{0,1200})/i);
  if (!controlSectionMatch) return analysis;

  analysis.found = true;
  const block = controlSectionMatch[1];

  // Split lines and parse by keywords
  const lines = block.split(/\r?\n/);
  lines.forEach(line => {
    const lower = line.toLowerCase();

    // Owners
    if (lower.includes('owner') && !lower.includes('email')) {
      const nameMatch = line.match(/owner\/s\s*[:\-]?\s*(.*)/i);
      if (nameMatch && nameMatch[1]) {
        const name = nameMatch[1].trim();
        if (isValidOwnerName(name)) {
          analysis.owners.push(name);
        }
      }
    }

    // Sign-off Dates
    const dateMatch = line.match(/(\d{1,2}\s+\w+\s+\d{4})/); // e.g. 01 April 2025
    if (dateMatch && dateMatch[1]) {
      analysis.signOffDates.push(dateMatch[1]);
    }

    // Departments
    const deptMatch = line.match(/(risk|streamlining|compliance|audit|technology|finance)/i);
    if (deptMatch && deptMatch[1]) {
      analysis.departments.push(deptMatch[1]);
    }

    // Roles (look for common label prefix)
    const roleMatch = line.match(/(owner|user|writer|reviewer|approver)/i);
    if (roleMatch && roleMatch[1]) {
      analysis.roles.push(roleMatch[1]);
    }
  });

  // Deduplicate all
  analysis.owners = [...new Set(analysis.owners)];
  analysis.signOffDates = [...new Set(analysis.signOffDates)];
  analysis.roles = [...new Set(analysis.roles)];
  analysis.departments = [...new Set(analysis.departments)];

  console.log('📊 Parsed Document Control Table:', analysis);
  return analysis;
}

function analyzeHSBCRiskAssessment(text) {
  console.log('🔍 Analyzing Risk Assessment...');
  
  const analysis = {
    found: false,
    rating: null,
    score: null,
    details: []
  };

  // Look for risk-based rating section
  const riskSectionPattern = /risk[-\s]*based\s+rating/gi;
  if (!riskSectionPattern.test(text)) {
    return analysis;
  }

  analysis.found = true;

  // Extract risk rating
  const riskRatingPatterns = [
    /(?:risk\s+rating\s+is|rating\s*:)\s*(high|medium|low)/gi,
    /procedure\s+risk\s+rating\s+is\s+(high|medium|low)/gi,
    /risk[-\s]*based\s+rating.*?(high|medium|low)/gi
  ];

  for (const pattern of riskRatingPatterns) {
    const match = pattern.exec(text);
    if (match) {
      analysis.rating = match[1].charAt(0).toUpperCase() + match[1].slice(1).toLowerCase();
      break;
    }
  }

  // Map rating to score
  if (analysis.rating) {
    switch (analysis.rating.toLowerCase()) {
      case 'high': analysis.score = 90; break;
      case 'medium': analysis.score = 60; break;
      case 'low': analysis.score = 30; break;
    }
  }

  console.log('Risk Assessment analysis result:', analysis);
  return analysis;
}

function analyzePeriodicReview(text) {
  console.log('🔍 Analyzing Periodic Review...');
  
  const analysis = {
    found: false,
    frequency: null,
    details: []
  };

  // Look for periodic review section
  const reviewSectionPattern = /(?:approved\s+)?periodic\s+review/gi;
  if (!reviewSectionPattern.test(text)) {
    return analysis;
  }

  analysis.found = true;

  // Extract review frequency
  const frequencyPatterns = [
    /(?:annually|yearly)\s*[-–]\s*for\s+the\s+(high|medium|low)\s+risk/gi,
    /(annually|yearly|quarterly|monthly|bi-annually|semi-annually)/gi
  ];

  for (const pattern of frequencyPatterns) {
    const match = pattern.exec(text);
    if (match) {
      analysis.frequency = match[1].charAt(0).toUpperCase() + match[1].slice(1).toLowerCase();
      if (match.length > 2) {
        analysis.details.push(`${analysis.frequency} for ${match[2]} risk rated procedures`);
      }
      break;
    }
  }

  console.log('Periodic Review analysis result:', analysis);
  return analysis;
}

function analyzeDefinitionsSection(text) {
  console.log('🔍 Analyzing Definitions section...');
  
  const analysis = {
    found: false,
    definitions: []
  };

  // Look for definitions section
  const definitionsSectionPattern = /definitions/gi;
  if (!definitionsSectionPattern.test(text)) {
    return analysis;
  }

  analysis.found = true;

  // Extract common HSBC definitions
  const definitionPatterns = [
    /([A-Z]{2,})\s*:\s*([^•\n]+)/g, // Acronyms followed by definitions
    /•\s+([A-Z]{2,})\s*:\s*([^•\n]+)/g // Bullet points with definitions
  ];

  definitionPatterns.forEach(pattern => {
    const matches = text.matchAll(pattern);
    for (const match of matches) {
      if (match[1] && match[2]) {
        analysis.definitions.push({
          term: match[1].trim(),
          definition: match[2].trim()
        });
      }
    }
  });

  console.log('Definitions analysis result:', {
    found: analysis.found,
    count: analysis.definitions.length
  });
  return analysis;
}

function analyzeGovernanceSection(text) {
  console.log('🔍 Analyzing Governance section...');
  
  const analysis = {
    found: false,
    details: []
  };

  // Look for governance section
  const governancePattern = /governance\s+of\s+this\s+document/gi;
  if (governancePattern.test(text)) {
    analysis.found = true;
    analysis.details.push('Governance section present');
  }

  console.log('Governance analysis result:', analysis);
  return analysis;
}

function analyzeUpdateTriggers(text) {
  console.log('🔍 Analyzing Update Triggers...');
  
  const analysis = {
    found: false,
    triggers: []
  };

  // Look for triggers section
  const triggersPattern = /triggers?\s+for\s+document\s+update/gi;
  if (!triggersPattern.test(text)) {
    return analysis;
  }

  analysis.found = true;

  // Extract common triggers
  const triggerPatterns = [
    /change\s+in\s+(?:global\s+or\s+)?local\s+(?:policy|law|regulations?)/gi,
    /change\s+in\s+scope,?\s*activities,?\s*processes/gi,
    /material\s+(?:regulatory|legal|business)\s+environment\s+changes?/gi
  ];

  triggerPatterns.forEach(pattern => {
    const matches = text.matchAll(pattern);
    for (const match of matches) {
      analysis.triggers.push(match[0]);
    }
  });

  console.log('Update Triggers analysis result:', analysis);
  return analysis;
}

// Enhanced name validation for HSBC context
function isValidOwnerName(name) {
  if (!name || name.length < 2 || name.length > 50) return false;
  
  // Remove common noise patterns
  const excludePatterns = [
    /last\s+updated?\s+date/gi,
    /sign[\s-]*off\s+date/gi,
    /effective\s+date/gi,
    /version\s+\d+/gi,
    /table\s+of\s+contents/gi,
    /page\s+\d+/gi,
    /^\d+$/,  // Numbers only
    /^[^a-zA-Z]*$/,  // No letters
    /position\/department/gi,
    /role/gi,
    /name/gi,
    /streamlining$/gi // Department name only
  ];
  
  for (const pattern of excludePatterns) {
    if (pattern.test(name)) return false;
  }

  // Must contain at least one letter and look like a name
  if (!/[a-zA-Z]/.test(name)) return false;

  // Should look like a name (has space or multiple words)
  const words = name.trim().split(/\s+/).filter(word => word.length >= 2);
  if (words.length >= 1 && words.every(word => /^[a-zA-Z\s\-\.]+$/.test(word))) {
    return true;
  }

  return false;
}

// ===============================
// Export for SharePoint CDN
// ===============================
if (typeof window !== 'undefined') {
  window.documentAnalysis = {
    analyzeDocument,
    analyzeDocumentControlTable,
    analyzeHSBCRiskAssessment,
    analyzePeriodicReview,
    analyzeDefinitionsSection,
    analyzeGovernanceSection,
    analyzeUpdateTriggers,
    isValidOwnerName
  };
}
