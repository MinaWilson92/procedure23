// services/documentAnalysis.js - Enhanced HSBC AI Analysis with 85% Threshold & Fixed Owner Extraction

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

    // 1. DOCUMENT CONTROL TABLE ANALYSIS (ENHANCED)
    const documentControlAnalysis = analyzeDocumentControlTable(text);
    if (documentControlAnalysis.found) {
      analysis.details.hasDocumentControl = true;
      analysis.details.hasOwners = documentControlAnalysis.owners.length > 0;
      analysis.details.owners = documentControlAnalysis.owners;
      analysis.details.hasSignOffDates = documentControlAnalysis.signOffDates.length > 0;
      analysis.details.signOffDates = documentControlAnalysis.signOffDates;
      analysis.details.departments = documentControlAnalysis.departments;
      analysis.details.roles = documentControlAnalysis.roles;
      analysis.details.extractedData.documentControlTable = documentControlAnalysis;
      analysis.details.foundElements.push('Document Control Table');
      score += 25; // High weight for document control
      
      console.log('✅ Document Control Table found:', {
        owners: documentControlAnalysis.owners,
        signOffDates: documentControlAnalysis.signOffDates,
        departments: documentControlAnalysis.departments,
        roles: documentControlAnalysis.roles
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
// 🔧 ENHANCED DOCUMENT CONTROL TABLE ANALYSIS - FIXED FOR HSBC TEMPLATE
// ============================================================================

function analyzeDocumentControlTable(text) {
  console.log('🔍 Enhanced parsing of HSBC Document Control table...');

  const analysis = {
    found: false,
    owners: [],
    signOffDates: [],
    roles: [],
    departments: [],
    versions: []
  };

  // ✅ STEP 1: Find Document Control Section (more flexible)
  const controlSectionPatterns = [
    /1\.\s*Document Control([\s\S]{0,2000}?)(?=\d+\.|$)/i, // Standard numbering
    /Document Control([\s\S]{0,2000}?)(?=\d+\.|$)/i,       // Without numbering
    /Version\s+\d+.*?current.*?version([\s\S]{0,2000}?)(?=\d+\.|$)/i // Version table
  ];

  let controlBlock = null;
  for (const pattern of controlSectionPatterns) {
    const match = text.match(pattern);
    if (match) {
      controlBlock = match[1] || match[0];
      analysis.found = true;
      break;
    }
  }

  if (!controlBlock) {
    console.log('❌ Document Control section not found');
    return analysis;
  }

  console.log('✅ Document Control section found, parsing table...');

  // ✅ STEP 2: Enhanced Table Parsing for Your Format
  const lines = controlBlock.split(/\r?\n/).map(line => line.trim()).filter(line => line.length > 0);
  
  // Look for table structure: Role | Name | Position/Department | Sign-off Date
  let inTableData = false;
  let currentRole = '';

  lines.forEach((line, index) => {
    const lowerLine = line.toLowerCase();
    
    // Skip header lines and empty rows
    if (lowerLine.includes('version') && lowerLine.includes('current')) return;
    if (lowerLine.includes('role') && lowerLine.includes('name')) {
      inTableData = true;
      return;
    }
    if (lowerLine.includes('position') && lowerLine.includes('department')) return;
    if (lowerLine.includes('sign-off')) return;

    // ✅ ENHANCED NAME EXTRACTION - Multiple Strategies
    
    // Strategy 1: Table row format (Role | Name | Department | Date)
    const tableRowMatch = line.match(/^([\w\/]+)\s+([A-Za-z\s]+?)\s+([\w\s]+?)\s+(\d{1,2}\s+\w+\s+\d{4})$/);
    if (tableRowMatch) {
      const [, role, name, dept, date] = tableRowMatch;
      if (isValidOwnerName(name.trim())) {
        analysis.owners.push(name.trim());
        analysis.roles.push(role.trim());
        analysis.departments.push(dept.trim());
        analysis.signOffDates.push(date.trim());
        console.log(`✅ Extracted from table row: ${name.trim()} (${role.trim()})`);
      }
      return;
    }

    // Strategy 2: Your exact format - "Owner/s    Mina Nada    Streamlining    01 April 2025"
    const ownerRowMatch = line.match(/^(Owner\/s|User\/s|Writer\/s|Reviewer\/s|Risk\s+Steward\/s)\s+([A-Za-z\s]+?)\s+([A-Za-z\s]+?)\s+(\d{1,2}\s+\w+\s+\d{4})$/i);
    if (ownerRowMatch) {
      const [, role, name, dept, date] = ownerRowMatch;
      if (isValidOwnerName(name.trim())) {
        analysis.owners.push(name.trim());
        analysis.roles.push(role.trim());
        analysis.departments.push(dept.trim());
        analysis.signOffDates.push(date.trim());
        console.log(`✅ Extracted from owner row: ${name.trim()} (${role.trim()})`);
      }
      return;
    }

    // Strategy 3: Role on separate line, then name
    if (/^(Owner\/s|User\/s|Writer\/s|Reviewer\/s|Risk\s+Steward\/s)$/i.test(line)) {
      currentRole = line.trim();
      return;
    }

    // Strategy 4: If we have a current role, try to extract name from next lines
    if (currentRole && inTableData) {
      // Look for name pattern: First Last (with possible middle names)
      const nameMatch = line.match(/^([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)/);
      if (nameMatch && isValidOwnerName(nameMatch[1])) {
        analysis.owners.push(nameMatch[1].trim());
        analysis.roles.push(currentRole);
        
        // Try to extract department and date from the same line
        const restOfLine = line.replace(nameMatch[1], '').trim();
        const deptDateMatch = restOfLine.match(/^([A-Za-z\s]+?)\s+(\d{1,2}\s+\w+\s+\d{4})$/);
        if (deptDateMatch) {
          analysis.departments.push(deptDateMatch[1].trim());
          analysis.signOffDates.push(deptDateMatch[2].trim());
        }
        
        console.log(`✅ Extracted from role context: ${nameMatch[1].trim()} (${currentRole})`);
        currentRole = ''; // Reset after use
      }
    }

    // Strategy 5: Extract dates independently
    const dateMatch = line.match(/(\d{1,2}\s+(?:January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{4})/i);
    if (dateMatch) {
      analysis.signOffDates.push(dateMatch[1]);
    }

    // Strategy 6: Extract departments independently
    const deptMatch = line.match(/\b(Streamlining|Risk|Compliance|Audit|Technology|Finance|Operations|Legal|HR|Human Resources)\b/i);
    if (deptMatch) {
      analysis.departments.push(deptMatch[1]);
    }
  });

  // ✅ STEP 3: Fallback - Simple text scanning for names
  if (analysis.owners.length === 0) {
    console.log('🔄 Using fallback name extraction...');
    
    // Look for common name patterns in the entire block
    const namePatterns = [
      /Owner\/s[:\s]+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)/gi,
      /Name[:\s]+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)/gi,
      /([A-Z][a-z]+\s+[A-Z][a-z]+)(?:\s+(?:Streamlining|Risk|Compliance|Audit))/gi
    ];

    namePatterns.forEach(pattern => {
      const matches = controlBlock.matchAll(pattern);
      for (const match of matches) {
        const name = match[1].trim();
        if (isValidOwnerName(name) && !analysis.owners.includes(name)) {
          analysis.owners.push(name);
          console.log(`✅ Fallback extracted: ${name}`);
        }
      }
    });
  }

  // ✅ STEP 4: Clean up and deduplicate
  analysis.owners = [...new Set(analysis.owners.filter(owner => isValidOwnerName(owner)))];
  analysis.signOffDates = [...new Set(analysis.signOffDates)];
  analysis.roles = [...new Set(analysis.roles)];
  analysis.departments = [...new Set(analysis.departments)];

  console.log('📊 Final Document Control Analysis:', {
    found: analysis.found,
    owners: analysis.owners,
    departments: analysis.departments,
    signOffDates: analysis.signOffDates,
    roles: analysis.roles
  });

  return analysis;
}

// ✅ IMPROVED NAME VALIDATION - Less Restrictive
function isValidOwnerName(name) {
  if (!name || typeof name !== 'string') return false;
  
  const trimmedName = name.trim();
  
  // Must be reasonable length
  if (trimmedName.length < 2 || trimmedName.length > 50) return false;
  
  // ✅ RELAXED EXCLUSIONS - Only exclude obvious non-names
  const excludePatterns = [
    /^(role|name|owner|position|department|sign-off|date|version|current|table)$/i,
    /^(streamlining|risk|compliance|audit|technology|finance|operations|legal|hr)$/i,
    /last\s+updated?\s+date/i,
    /effective\s+date/i,
    /^\d+$/,                    // Numbers only
    /^[^a-zA-Z]*$/,            // No letters at all
    /^[a-z\s]+$/,              // All lowercase (likely not a name)
    /table\s+of\s+contents/i,
    /page\s+\d+/i
  ];
  
  // Check exclusions
  for (const pattern of excludePatterns) {
    if (pattern.test(trimmedName)) {
      return false;
    }
  }

  // ✅ POSITIVE NAME VALIDATION - Must look like a name
  // Should contain at least one letter
  if (!/[a-zA-Z]/.test(trimmedName)) return false;

  // Should start with a capital letter (typical for names)
  if (!/^[A-Z]/.test(trimmedName)) return false;

  // For multi-word names, each word should be capitalized
  const words = trimmedName.split(/\s+/).filter(word => word.length > 0);
  
  // Single word names are OK if they're capitalized and reasonable
  if (words.length === 1) {
    return words[0].length >= 2 && /^[A-Z][a-z]+$/.test(words[0]);
  }

  // Multi-word: each word should be properly capitalized
  const validWords = words.every(word => 
    /^[A-Z][a-z]*$/.test(word) && word.length >= 1
  );

  // Should be 2-4 words max (First Middle? Last Suffix?)
  return validWords && words.length <= 4;
}

// ============================================================================
// HSBC TEMPLATE SPECIFIC ANALYSIS FUNCTIONS (UNCHANGED)
// ============================================================================

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
 console.log('✅ Enhanced HSBC Document Analysis Engine loaded successfully with 85% threshold, 5 critical deciders, and improved owner extraction');
}

// ===============================
// Export for Node.js/Module environments
// ===============================
if (typeof module !== 'undefined' && module.exports) {
 module.exports = {
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
