const { CATEGORIES } = require('../shared/constants');

// Classification rules - order matters (first match wins)
const CLASSIFICATION_RULES = [
  { 
    pattern: /class\s*7|class7|ch\.?7|chapter\s*7|7th/i, 
    category: 'Class 7',
    priority: 1 
  },
  { 
    pattern: /class\s*8|class8|ch\.?8|chapter\s*8|8th/i, 
    category: 'Class 8',
    priority: 1 
  },
  { 
    pattern: /class\s*9|class9|ch\.?9|chapter\s*9|9th/i, 
    category: 'Class 9',
    priority: 1 
  },
  { 
    pattern: /class\s*10|class10|ch\.?10|chapter\s*10|10th/i, 
    category: 'Class 10',
    priority: 1 
  },
  { 
    pattern: /gym|workout|exercise|fitness|training|cardio|yoga|pushup|squat/i, 
    category: 'Gym Videos',
    priority: 2 
  },
];

/**
 * Classify a video based on its filename
 * @param {string} filename - The video filename
 * @returns {Object} Classification result with category and metadata
 */
function classifyVideo(filename) {
  const lowerFilename = filename.toLowerCase();
  
  // Try each rule
  for (const rule of CLASSIFICATION_RULES) {
    if (rule.pattern.test(lowerFilename)) {
      return {
        category: rule.category,
        autoClassified: true,
        confidence: 'high',
        matchedRule: rule.pattern.toString()
      };
    }
  }
  
  // Default category
  return {
    category: 'Other',
    autoClassified: true,
    confidence: 'default',
    matchedRule: null
  };
}

/**
 * Manually reclassify a video
 * @param {string} newCategory - The new category
 * @returns {Object} Classification result
 */
function manualClassify(newCategory) {
  if (!CATEGORIES.includes(newCategory)) {
    throw new Error(`Invalid category: ${newCategory}`);
  }
  
  return {
    category: newCategory,
    autoClassified: false,
    manualOverride: true,
    classifiedAt: new Date().toISOString()
  };
}

/**
 * Bulk classify multiple videos
 * @param {Array} filenames - Array of filenames
 * @returns {Array} Array of classification results
 */
function bulkClassify(filenames) {
  return filenames.map(filename => ({
    filename,
    ...classifyVideo(filename)
  }));
}

/**
 * Get suggested category based on partial filename match
 * @param {string} partialName - Partial filename
 * @returns {Array} Array of suggested categories with confidence
 */
function getSuggestions(partialName) {
  const suggestions = [];
  const lowerName = partialName.toLowerCase();
  
  for (const rule of CLASSIFICATION_RULES) {
    if (rule.pattern.test(lowerName)) {
      suggestions.push({
        category: rule.category,
        confidence: 'high'
      });
    }
  }
  
  if (suggestions.length === 0) {
    suggestions.push({
      category: 'Other',
      confidence: 'default'
    });
  }
  
  return suggestions;
}

module.exports = {
  classifyVideo,
  manualClassify,
  bulkClassify,
  getSuggestions,
  CLASSIFICATION_RULES
};
