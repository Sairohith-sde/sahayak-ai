/**
 * Deterministic Fallback Parser
 * Operates entirely locally when Ollama is unavailable.
 * Uses pattern matching and clinical keyword scanning to extract observations,
 * assign risk levels, and compile a report.
 */

const RISK_KEYWORDS = {
  critical: [
    { words: ['stop', 'abandon', 'drop', 'quit', 'chhod', 'nahi le raha', 'दवा बंद', 'మందులు ఆపేశారు', 'மருந்து நிறுத்தப்பட்டது', 'महारोग'], category: 'compliance', label: 'TB/HIV treatment abandonment' },
    { words: ['not gaining weight', 'vazan nahi badh', 'weight loss', 'severe wasting', 'malnourished', 'severe malnutrition', 'బరువు ఇంకా పెరగలేదు', 'వజన్ ఇంకా పెరగలేదు', 'வஜன் இன்னும் அதிகரிக்கவில்லை', 'வஜன் கூடவில்லை', 'वजन नहीं बढ़ रहा', 'वजन वाढले नाही', 'ওজন বাড়ছে না', 'ਭਾਰ ਨਹੀਂ ਵਧ ਰਿਹਾ', 'વજન વધતું નથી', 'ଓଜନ ବଢୁନାହିଁ'], category: 'nutrition', label: 'Severe child malnutrition' },
    { words: ['bleeding', 'severe pain', 'extreme swelling', 'vision blurred', 'dhundhla', 'seizure', 'blurred vision', 'కళ్ళు తిరగడం', 'பார்வை மங்கல்', 'धुंधला'], category: 'maternal', label: 'Severe obstetric danger sign' },
    { words: ['extreme weak', 'not waking', 'unconscious', 'behoshi', 'పడిపోవడం', 'மயக்கம்', 'बेहोश'], category: 'general', label: 'Patient unresponsive/critical weakness' }
  ],
  high: [
    { words: ['missed vaccine', 'missed immunization', 'tika chhoot', 'no vaccine', 'not vaccinated', 'टीका नहीं लगा', 'టీకా వేయలేదు', 'తడుప్పూసి పోడవిల్లై', 'தடுப்பூசி போடவில்லை', 'లసಿಕೆ ಹಾಕಿಲ್ಲ', 'വാക്സിൻ എടുത്തിട്ടില്ല', 'लस दिली नाही', 'টিকা দেওয়া হয়নি', 'ਟੀਕਾਕਰਨ ਨਹੀਂ ਹੋਇਆ', 'રસી લીધી નથી', 'ଟିକା ଦିଆଯାଇନାହିଁ'], category: 'immunization', label: 'Missed vital childhood immunization' },
    { words: ['fever', 'bukhaar', 'temperature', 'body hot', 'बुखार', 'ज्वరం', 'காய்ச்சல்', 'ಜ್ವರ', 'പനി', 'ताप', 'ज्वर', 'ਬੁਖਾਰ', 'તાવ'], category: 'general', label: 'Active infant or maternal fever' },
    { words: ['cough', 'khansi', 'sputum', 'खांसी', 'దగ్గు', 'இருமல்', 'ಕೆಮ್ಮು', 'ചുമ', 'खोकला', 'কাশি', 'ਖੰਘ', 'ખાંસી', 'କାଶ'], category: 'TB_HIV', label: 'Symptomatic pulmonary TB risk' },
    { words: ['swelling', 'sujan', 'headache', 'pain', 'सुजन', 'వాపు', 'வீக்கம்', 'ಊತ', 'सूज', 'ফোলা', 'ਸੋਜ', 'સોજો', 'ଫୋଲା'], category: 'maternal', label: 'Pregnancy-related hypertension risk' }
  ],
  medium: [
    { words: ['weak', 'kamzori', 'tired', 'thakan', 'కంగారు', 'சோர்வு', 'कमजोरी'], category: 'general', label: 'Mild clinical weakness' },
    { words: ['rash', 'daane', 'itching', 'தடிப்பு', 'खुजली'], category: 'general', label: 'General skin rash' },
    { words: ['vomit', 'ultig', 'వాంతులు', 'வாந்தி', 'उल्टी'], category: 'general', label: 'Moderate gastric distress' }
  ]
};

export function fallbackParse(transcript, categoryPref = 'general') {
  const text = transcript.toLowerCase();
  
  // 1. Extract Observations
  // Split transcript into sentences to extract discrete observations
  const sentences = transcript.split(/[.।!?]+/).map(s => s.trim()).filter(Boolean);
  const observations = sentences.length > 0 ? sentences : ["Routine household visit conducted."];

  // 2. Identify Risk Indicators and Determine Risk Level
  const riskIndicators = [];
  let riskLevel = 'low';
  let reason = 'Routine wellness check, no urgent indicators detected.';

  // Scan for critical conditions
  for (const rule of RISK_KEYWORDS.critical) {
    if (rule.words.some(word => text.includes(word))) {
      riskIndicators.push(rule.label);
      if (riskLevel !== 'critical') {
        riskLevel = 'critical';
        reason = `Critical risk detected: ${rule.label}. Requires immediate attention.`;
      }
    }
  }

  // Scan for high conditions (if not already critical)
  for (const rule of RISK_KEYWORDS.high) {
    if (rule.words.some(word => text.includes(word))) {
      riskIndicators.push(rule.label);
      if (riskLevel === 'low' || riskLevel === 'medium') {
        riskLevel = 'high';
        reason = `High risk detected: ${rule.label}. Requires follow-up within days.`;
      }
    }
  }

  // Scan for medium conditions
  for (const rule of RISK_KEYWORDS.medium) {
    if (rule.words.some(word => text.includes(word))) {
      riskIndicators.push(rule.label);
      if (riskLevel === 'low') {
        riskLevel = 'medium';
        reason = `Moderate indicator detected: ${rule.label}. Worth monitoring.`;
      }
    }
  }

  // Double Check Category
  let category = categoryPref;
  if (text.includes('vaccine') || text.includes('tika') || text.includes('immuniz')) {
    category = 'immunization';
  } else if (text.includes('weight') || text.includes('vazan') || text.includes('nutrition') || text.includes('feed')) {
    category = 'child_nutrition';
  } else if (text.includes('tb') || text.includes('hiv') || text.includes('cough') || text.includes('dava')) {
    category = 'TB_HIV';
  } else if (text.includes('pregnant') || text.includes('delivery') || text.includes('maternal') || text.includes('bachha')) {
    category = 'maternal';
  }

  const followUpNeeded = ['critical', 'high', 'medium'].includes(riskLevel) ? 'yes' : 'no';
  const followUpReason = followUpNeeded === 'yes' ? reason : 'Routine scheduled visit.';

  const extractedData = {
    observations,
    riskIndicators,
    followUpNeeded,
    followUpReason,
    source: 'fallback'
  };

  // Compile Report
  const report = {
    title: "Sahayak AI Government Health Report",
    institution: "National Health Mission, Community Care Initiative",
    riskLevel: riskLevel.toUpperCase(),
    summary: `Extracted from natural observations. Patient exhibits indicators matching a ${riskLevel.toUpperCase()} priority status. Key observations: ${observations.join('; ')}`,
    extractedDetails: {
      observations,
      indicators: riskIndicators.length > 0 ? riskIndicators : ["None reported"],
      followUp: followUpNeeded === 'yes' ? `Yes, reason: ${followUpReason}` : "No immediate follow-up required"
    },
    source: 'fallback'
  };

  return {
    category,
    extractedData,
    riskLevel,
    riskJustification: reason,
    report
  };
}
