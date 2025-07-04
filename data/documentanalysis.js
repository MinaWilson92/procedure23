// services/documentAnalysis.js - Enhanced HSBC AI Analysis with 85% Threshold & 20-point Penalties

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
        signOffDates: documentControlAnalysis.signOffDates,
        departments: documentControlAnalysis.departments
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
        priority: 'HIGH',
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
    // 🎯 ENHANCED PENALTY SYSTEM - 5 CRITICAL DECIDERS WITH 20-POINT PENALTIES
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

    // ✅ 5 CRITICAL DECIDERS - EACH MISSING = -20 POINTS
    const criticalDeciders = [
      { 
        key: 'documentOwners', 
        label: 'Document Owners', 
        penalty: 20,
        found: analysis.details.structuredStatus.documentOwners.found,
        description: 'Clearly identified document owners in Document Control table'
      },
      { 
        key: 'riskRating', 
        label: 'Risk Rating', 
        penalty: 20,
        found: analysis.details.structuredStatus.riskRating.found,
        description: 'Risk-based rating section with High/Medium/Low classification'
      },
      { 
        key: 'periodicReview', 
        label: 'Periodic Review', 
        penalty: 20,
        found: analysis.details.structuredStatus.periodicReview.found,
        description: 'Approved periodic review schedule (Annually, Bi-annually, etc.)'
      },
      { 
        key: 'signOffDates', 
        label: 'Sign-off Dates', 
        penalty: 20,
        found: analysis.details.structuredStatus.signOffDates.found,
        description: 'Valid sign-off dates in Document Control table'
      },
      { 
        key: 'departments', 
        label: 'Departments', 
        penalty: 20,
        found: analysis.details.structuredStatus.departments.found,
        description: 'Department information in Document Control table'
      }
    ];

    let totalPenalty = 0;
    let missedDeciders = [];

    console.log('🎯 Evaluating 5 Critical HSBC Deciders:');
    
    criticalDeciders.forEach(decider => {
      if (!decider.found) {
        totalPenalty += decider.penalty;
        missedDeciders.push(decider.label);
        
        console.log(`❌ CRITICAL MISS: ${decider.label} (-${decider.penalty} points)`);
        
        analysis.aiRecommendations.push({
          type: 'critical_' + decider.key.toLowerCase(),
          priority: 'CRITICAL',
          message: `CRITICAL DECIDER MISSING: ${decider.label}. ${decider.description}`,
          impact: `-${decider.penalty} points`,
          category: 'HSBC Compliance'
        });
      } else {
        console.log(`✅ CRITICAL FOUND: ${decider.label} (+0 points, already counted)`);
      }
    });

    // ✅ APPLY PENALTY TO FINAL SCORE
    const baseScore = Math.min(100, score);
    const finalScore = Math.max(0, baseScore - totalPenalty);
    
    console.log('📊 HSBC Scoring Summary:', {
      baseStructureScore: baseScore,
      totalPenalty: totalPenalty,
      finalScore: finalScore,
      criticalDecidersMissed: missedDeciders.length,
      missedDeciders: missedDeciders,
      passesThreshold: finalScore >= 85 // Updated threshold
    });

    analysis.score = finalScore;

    // ✅ UPDATED SUMMARY WITH CRITICAL DECIDER INFO
    analysis.details.summary = {
      templateCompliance: analysis.score >= 85 ? 'High' : analysis.score >= 70 ? 'Medium' : 'Low', // Updated thresholds
      documentType: 'HSBC Local Procedure',
      foundElements: analysis.details.foundElements.length,
      missingElements: analysis.details.missingElements.length,
      hasMinimumGovernance: analysis.details.hasDocumentControl && analysis.details.hasOwners,
      hasRiskManagement: analysis.details.hasRiskAssessment,
      hasReviewProcess: analysis.details.hasPeriodicReview,
      structureScore: baseScore,
      governanceScore: (analysis.details.hasDocumentControl ? 50 : 0) + (analysis.details.hasRiskAssessment ? 30 : 0) + (analysis.details.hasPeriodicReview ? 20 : 0),
      recommendations: analysis.aiRecommendations.length,
      
      // ✅ CRITICAL DECIDER TRACKING
      criticalDecidersPassed: criticalDeciders.filter(d => d.found).length,
      criticalDecidersFailed: criticalDeciders.filter(d => !d.found).length,
      criticalDeciersTotal: criticalDeciders.length,
      appliedPenalty: totalPenalty,
      baseScore: baseScore,
      missedCriticalDeciders: missedDeciders,
      minimumThreshold: 85 // Updated minimum threshold
    };

    // ✅ UPDATED HSBC TEMPLATE COMPLIANCE MESSAGE
    if (analysis.score < 85) {
      const failureMessage = missedDeciders.length > 0 ? 
        `Document fails HSBC compliance standards (${analysis.score}%). Missing ${missedDeciders.length} critical decider${missedDeciders.length > 1 ? 's' : ''}: ${missedDeciders.join(', ')}. Each missing decider reduces score by 20 points.` :
        `Document does not meet HSBC template standards (${analysis.score}%). Minimum required: 85%.`;
        
      analysis.aiRecommendations.push({
        type: 'hsbc_compliance_failure',
        priority: 'CRITICAL',
        message: failureMessage,
        impact: 'Upload Blocked',
        category: 'HSBC Compliance'
      });
    } else {
      analysis.aiRecommendations.push({
        type: 'hsbc_compliance_success',
        priority: 'INFO',
        message: `✅ Document meets HSBC compliance standards (${analysis.score}%). All critical deciders validated.`,
        impact: 'Upload Approved',
        category: 'HSBC Compliance'
      });
    }

    // Sort recommendations by priority (CRITICAL > HIGH > MEDIUM > LOW > INFO)
    const priorityOrder = { 'CRITICAL': 5, 'HIGH': 4, 'MEDIUM': 3, 'LOW': 2, 'INFO': 1 };
    analysis.aiRecommendations.sort((a, b) => {
      return priorityOrder[b.priority] - priorityOrder[a.priority];
    });

    console.log('✅ Enhanced HSBC template analysis completed:', {
      finalScore: analysis.score,
      threshold: '85%',
      penalty: totalPenalty,
      criticalDecidersPassed: `${criticalDeciders.filter(d => d.found).length}/5`,
      uploadApproved: analysis.score >= 85,
      templateCompliance: analysis.details.summary.templateCompliance,
      foundElements: analysis.details.foundElements.length,
      totalRecommendations: analysis.aiRecommendations.length
    });

  } catch (err) {
    console.error('❌ Error in enhanced document analysis:', err);
    analysis.details.error = err.message;
    analysis.score = 0;
    analysis.aiRecommendations.push({
      type: 'analysis_error',
      priority: 'CRITICAL',
      message: `Document analysis failed: ${err.message}. Please check the file format and try again.`,
      impact: 'Score: 0',
      category: 'System Error'
    });
  }

  return analysis;
}

// ============================================================================
// 🔧 ONLY FIX: DOCUMENT CONTROL TABLE ANALYSIS - MINIMAL CHANGE
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

  // 🔧 ONLY CHANGE: Better name extraction for "Owner/s    Mina Nada    Streamlining    01 April 2025"
  const ownerLineMatch = block.match(/Owner\/s\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\s+([A-Za-z]+)\s+(\d{1,2}\s+\w+\s+\d{4})/i);
  if (ownerLineMatch) {
    const [, name, dept, date] = ownerLineMatch;
    analysis.owners.push(name.trim());
    analysis.departments.push(dept.trim());
    analysis.signOffDates.push(date.trim());
    analysis.roles.push('Owner');
    
    console.log(`✅ FIXED: Extracted owner "${name.trim()}" from your HSBC template`);
    return analysis;
  }

  // Keep original logic as fallback
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
    const deptMatch = line.match(/(risk|streamlining|compliance|audit|technology|finance|operations|legal|hr|human resources)/i);
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

  // 🔧 FIXED: Extract review frequency - prioritize frequency words first
  const frequencyPatterns = [
    // Pattern 1: Your exact format "Annually – For the High risk rated LP/OI"
    /(annually|yearly|quarterly|monthly|bi-annually|semi-annually)\s*[-–]\s*for\s+the\s+(high|medium|low)\s+risk/gi,
    // Pattern 2: Just the frequency word anywhere in the section
    /(annually|yearly|quarterly|monthly|bi-annually|semi-annually)/gi
  ];

  for (const pattern of frequencyPatterns) {
    const match = pattern.exec(text);
    if (match) {
      // Take the FIRST capture group (the frequency, not the risk level)
      analysis.frequency = match[1].charAt(0).toUpperCase() + match[1].slice(1).toLowerCase();
      
      // If we have both frequency and risk level, add to details
      if (match.length > 2 && match[2]) {
        analysis.details.push(`${analysis.frequency} for ${match[2]} risk rated procedures`);
      }
      
      console.log(`✅ FIXED: Extracted frequency "${analysis.frequency}" from periodic review`);
      break; // Stop after first match
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
  console.log('✅ Enhanced HSBC Document Analysis Engine loaded successfully with 85% threshold and 5 critical deciders');
}
