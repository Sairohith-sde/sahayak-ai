import axios from 'axios';
import dotenv from 'dotenv';
import { fallbackParse } from '../utils/fallbackParser.js';

dotenv.config();

const OLLAMA_BASE_URL = process.env.OLLAMA_BASE_URL || 'http://localhost:11434';
const OLLAMA_CHAT_MODEL = process.env.OLLAMA_CHAT_MODEL || 'llama3.1:8b';

export let offlineSimulation = false;
export function setOfflineSimulation(val) {
  offlineSimulation = val;
}

/**
 * Robust Ollama API Runner
 * Calls local Ollama service, falling back immediately to local heuristic parser if down.
 */
async function callOllama(prompt, jsonMode = false) {
  if (offlineSimulation) {
    throw new Error('Offline simulation active: Ollama bypassed.');
  }
  try {
    const response = await axios.post(`${OLLAMA_BASE_URL}/api/generate`, {
      model: OLLAMA_CHAT_MODEL,
      prompt: prompt,
      stream: false,
      options: {
        temperature: 0.1,
        num_ctx: 4096
      },
      ...(jsonMode ? { format: 'json' } : {})
    }, {
      timeout: 5000 // 5 seconds timeout
    });

    return response.data.response;
  } catch (error) {
    throw new Error(`Ollama service unavailable: ${error.message}`);
  }
}

/**
 * STAGE 1: EXTRACTOR
 */
export async function runExtractor(transcript, categoryPref = 'general') {
  const prompt = `
You are a Frontline Health Worker data extraction assistant. 
Your task is to parse a natural-language field transcript of a home health visit and extract it into a structured JSON object.

Transcript: "${transcript}"

STRICT GUIDELINES:
1. ONLY extract information that is explicitly stated or strongly, direct-logically implied in the transcript.
2. NEVER fabricate or invent any clinical observations, temperatures, or symptoms.
3. Set followUpNeeded to "yes" or "no".
4. The transcript may be in Hindi, Telugu, Tamil, Kannada, Malayalam, Marathi, Bengali, Punjabi, Gujarati, Odia, or English. Extract the structured fields regardless of language. Do not translate — extract meaning only.

Your response MUST be a single, valid JSON object matching this exact schema:
{
  "household": { "name": "Extract patient or household name if mentioned, otherwise leave as unknown" },
  "category": "maternal" | "child_nutrition" | "TB_HIV" | "immunization" | "general",
  "observations": ["observation sentence 1", "observation sentence 2", ...],
  "riskIndicators": ["explicit risk indicator 1", ...],
  "followUpNeeded": "yes" | "no",
  "followUpReason": "Clear non-clinical reason for follow-up"
}

Respond ONLY with the JSON object. Do not include any preambles or markdown formatting.
`;

  try {
    const rawRes = await callOllama(prompt, true);
    const parsed = JSON.parse(rawRes);
    parsed.source = 'ai';
    return parsed;
  } catch (err) {
    console.warn(`⚠️ Extractor stage failed, reverting to local fallback: ${err.message}`);
    const fallback = fallbackParse(transcript, categoryPref);
    return {
      ...fallback.extractedData,
      category: fallback.category
    };
  }
}

/**
 * STAGE 2: RISK SCORER
 */
export async function runRiskScorer(extractedData) {
  const prompt = `
You are a Clinical Triage Prioritization assistant. Your goal is to assign a risk priority score and a one-sentence justification.

Extracted Data:
${JSON.stringify(extractedData, null, 2)}

TRIAGE RUBRIC:
- Critical: Immediate safety risk (e.g. severe wasting/malnutrition, TB treatment abandonment, obstetric danger signs like bleeding/severe vision blur)
- High: Clear risk indicator requiring follow-up within days (e.g. missed childhood immunization, active infant or maternal fever, persistent cough)
- Medium: Worth monitoring, not urgent (e.g. mild symptoms, minor fatigue, skin rash)
- Low: Routine, wellness check, no concerns

STRICT CLINICAL SAFETY GUARDRAIL:
- You MUST NOT output any diagnosis (e.g., do not say "patient has malaria" or "pre-eclampsia"). Only say "fever" or "pregnancy-related hypertension risk".
- You MUST NOT recommend any medication, dosage, or treatment (do not prescribe paracetamol, rest, or procedures).
- Your riskJustification MUST be a single sentence describing the TRIAGE urgency, not a diagnostic or prescriptive recommendation.

Your response MUST be a single, valid JSON object matching this exact schema:
{
  "riskLevel": "low" | "medium" | "high" | "critical",
  "riskJustification": "One-sentence clinical justification explaining why this triage level was selected."
}

Respond ONLY with the JSON object. Do not include any preambles.
`;

  try {
    const rawRes = await callOllama(prompt, true);
    const parsed = JSON.parse(rawRes);
    parsed.source = 'ai';
    return parsed;
  } catch (err) {
    console.warn(`⚠️ Risk Scorer stage failed, reverting to local fallback: ${err.message}`);
    // Simulate fallback logic on extracted indicators
    let riskLevel = 'low';
    let riskJustification = 'Routine wellness check, no urgent indicators detected.';
    
    const indicatorsStr = JSON.stringify(extractedData.riskIndicators).toLowerCase();
    const obsStr = JSON.stringify(extractedData.observations).toLowerCase();
    
    if (indicatorsStr.includes('abandon') || indicatorsStr.includes('severe wasting') || indicatorsStr.includes('bleeding') || indicatorsStr.includes('danger') || obsStr.includes('stop') || obsStr.includes('severe malnutrition')) {
      riskLevel = 'critical';
      riskJustification = 'Critical risk indicators detected in field observations.';
    } else if (indicatorsStr.includes('missed') || indicatorsStr.includes('fever') || indicatorsStr.includes('cough') || obsStr.includes('fever') || obsStr.includes('cough') || obsStr.includes('missed')) {
      riskLevel = 'high';
      riskJustification = 'High risk indicator present requiring clinical follow-up within days.';
    } else if (indicatorsStr.includes('weak') || indicatorsStr.includes('rash') || obsStr.includes('weak') || obsStr.includes('rash')) {
      riskLevel = 'medium';
      riskJustification = 'Moderate indicator observed, worth secondary scheduling.';
    }

    return {
      riskLevel,
      riskJustification,
      source: 'fallback'
    };
  }
}

/**
 * STAGE 3: REPORT WRITER
 */
export async function runReportWriter(extractedData, riskOutput, householdName = 'Unknown', workerName = 'Assigned Worker') {
  const prompt = `
You are generating a formal health visit report for a government
health system. The extracted data below may have been derived from
a transcript in Hindi, Telugu, Tamil, Kannada, or another Indian
regional language. Generate the ENTIRE report in clear, formal
English only. Do not include any regional language text in the
report output. Translate all observations, risk indicators, and
follow-up notes into English.

Patient/Household: ${householdName}
Health Worker: ${workerName}
Risk Level: ${riskOutput.riskLevel.toUpperCase()}
Extracted Visit Data:
${JSON.stringify(extractedData, null, 2)}

STRICT SAFETY VALIDATION:
- Ensure there is absolutely NO prescriptive or diagnostic language (e.g. no "diagnosed with pneumonia" or "take amoxicillin"). If any exists, strip it out.
- Keep the language completely objective, professional, and institutional.

Your response MUST be a single, valid JSON object matching this exact schema:
{
  "title": "Sahayak AI Government Health Report",
  "institution": "National Health Mission, Community Care Initiative",
  "householdName": "${householdName}",
  "healthWorker": "${workerName}",
  "date": "${new Date().toLocaleDateString('en-IN')}",
  "riskLevel": "${riskOutput.riskLevel.toUpperCase()}",
  "summary": "A high-quality professional summary of the visit observations and follow-up guidelines (maximum 3 sentences).",
  "extractedDetails": {
    "observations": ["observation 1", ...],
    "indicators": ["indicator 1", ...],
    "followUp": "Sentence summarizing the follow-up timeline and non-clinical reasons."
  }
}

Respond ONLY with the JSON object. Do not include any preambles.
`;

  try {
    const rawRes = await callOllama(prompt, true);
    const parsed = JSON.parse(rawRes);
    
    // Safety guardrail post-processing check
    parsed.summary = stripPrescriptiveLanguage(parsed.summary);
    if (parsed.extractedDetails && parsed.extractedDetails.followUp) {
      parsed.extractedDetails.followUp = stripPrescriptiveLanguage(parsed.extractedDetails.followUp);
    }
    
    parsed.source = 'ai';
    return parsed;
  } catch (err) {
    console.warn(`⚠️ Report Writer stage failed, reverting to local fallback: ${err.message}`);
    
    const translatedObservations = translateArrayToEnglish(extractedData.observations);
    const translatedIndicators = translateArrayToEnglish(extractedData.riskIndicators);
    const translatedFollowUpReason = translateTextToEnglish(extractedData.followUpReason);

    return {
      title: "Sahayak AI Government Health Report",
      institution: "National Health Mission, Community Care Initiative",
      householdName,
      healthWorker: workerName,
      date: new Date().toLocaleDateString('en-IN'),
      riskLevel: riskOutput.riskLevel.toUpperCase(),
      summary: `Household visit recorded. System priority registered as ${riskOutput.riskLevel.toUpperCase()}. Observations extracted: ${translatedObservations.join('; ')}`,
      extractedDetails: {
        observations: translatedObservations,
        indicators: translatedIndicators.length > 0 ? translatedIndicators : ["None reported"],
        followUp: extractedData.followUpNeeded === 'yes' ? `Yes, urgency reason: ${translatedFollowUpReason}` : "No immediate follow-up required."
      },
      source: 'fallback'
    };
  }
}

/**
 * Translation mapping for top regional health terms to ensure formal English report outputs.
 */
const TRANSLATION_MAP = [
  // Missed vaccinations
  { pattern: /missed\s*vaccine|missed\s*immunization|tika\s*chhoot|no\s*vaccine|not\s*vaccinated|टीका\s*नहीं\s*लगा|టీకా\s*వేయలేదు|தடுப்பூசி\s*போடவில்லை|తడుప్పూసి\s*போடவில்லை|లసಿಕೆ\s*ಹಾಕಿಲ್ಲ|വാക്സിൻ\s*എടുത്തിട്ടില്ല|लस\s*दिली\s*नाही|টিকা\s*দেওয়া\s*হয়নি|ਟੀਕਾਕਰਨ\s*ਨਹੀਂ\s*ਹੋਇਆ|ਰਸੀ\s*ਲੀધી\s*ਨથી|ଟିକา\s*ଦିଆଯାଇନାହିଁ/gi, repl: "Missed vital childhood immunization / vaccine lapse" },
  { pattern: /vaccine|immuniz|tika|లసಿಕೆ|ವಾക്സിൻ|लस|টিকা|ਟੀਕਾਕਰਨ|ਰਸੀ|ଟିକା|టీకా|தடுப்பூசி/gi, repl: "Immunization catch-up required" },
  { pattern: /missed|वदिलेसारु|தவறவிட்டார்|छूट गया/gi, repl: "Missed" },
  
  // Weight & Nutrition issues
  { pattern: /not\s*gaining\s*weight|weight\s*loss|severe\s*wasting|malnourished|severe\s*malnutrition|బరువు\s*ఇంకా\s*పెరగలేదు|వజన్\s*ఇంకా\s*పెరగలేదు|வஜன்\s*இன்னும்\s*அதிகரிக்கவில்லை|வஜன்\s*கூடவில்லை|वजन\s*नहीं\s*बढ़ रहा|वजन\s*वाढले\s*नाही|ওজন\s*বাড়ছে\s*না|ਭਾਰ\s*ਨਹੀਂ\s*ਵਧ\s*ਰਿਹਾ|વજન\s*વધતું\s*નથી|ଓଜନ\s*ବଢୁନାହିଁ/gi, repl: "No weight gain / severe wasting risk" },
  { pattern: /weight\s*loss|బరువు\s*తగ్గడం|எடை\s*குறைவு|वजन\s*कम/gi, repl: "Weight loss" },
  { pattern: /no\s*weight\s*gain|బరువు\s*పెరగలేదు|எடை\s*கூடவில்லை/gi, repl: "No weight gain" },
  { pattern: /weight|vazan|तूಕ|തൂക്കം|वजन|ওজন|ਭਾਰ|વજન|ଓଜନ/gi, repl: "Weight checked" },

  // Fever
  { pattern: /fever|bukhaar|temperature|body\s*hot|बुखार|ज्वరం|காய்ச்சல்|ಜ್ವರ|പനി|ताप|ज्वर|ਬੁਖਾਰ|તાવ/gi, repl: "Fever" },

  // Cough
  { pattern: /cough|khansi|sputum|खांसी|దగ్గు|இருமல்|ಕೆಮ್ಮು|ചുമ|खोकला|काशि|ਖੰਘ|ખાંસી|କାଶ/gi, repl: "Cough" },

  // Medication compliance
  { pattern: /stop|abandon|drop|quit|chhod|nahi\s*le\s*raha|दवा\s*बंद|మందులు\s*ఆపేశారు|மருந்து\s*நிறுத்தப்பட்டது|महारोग/gi, repl: "Critical medication non-compliance observed" },

  // Swelling
  { pattern: /swelling|sujan|headache|pain|सुजन|వాపు|வீக்கம்|ಊತ|सूज|ফোলা|ਸੋਜ|સોજો|ଫୋଲା/gi, repl: "Severe swelling & hypertension risk symptoms" },

  // Weakness
  { pattern: /weak|kamzori|tired|thakan|కంగారు|சோர்వు|कमजोरी/gi, repl: "Clinical fatigue and weakness reported" },

  // Maternal
  { pattern: /pregnant|delivery|maternal|bachha/gi, repl: "Maternal clinical indicators check" },

  // Vomiting
  { pattern: /vomit|ultig|వాంతులు|வாంటి|உள்ளி/gi, repl: "Gastric vomiting distress" },

  // Vision
  { pattern: /blurred\s*vision|dhundhla|seizure|కళ్ళు\s*తిరగడం|பார்வை\s*மங்கல்|धुंधला/gi, repl: "Blurred vision and seizure risk" }
];

function translateTextToEnglish(text) {
  if (!text) return '';
  let cleaned = String(text);
  
  TRANSLATION_MAP.forEach(item => {
    if (item.pattern.test(cleaned)) {
      cleaned = cleaned.replace(item.pattern, item.repl);
    }
  });
  
  // Strip any remaining non-ASCII regional script characters to guarantee pure English reports
  if (/[^\x00-\x7F]/.test(cleaned)) {
    cleaned = cleaned.replace(/[^\x00-\x7F]+/g, '').trim();
    if (!cleaned || cleaned.length < 5) {
      cleaned = "Patient health observations recorded during local home visit.";
    }
  }
  
  return cleaned;
}

function translateArrayToEnglish(arr) {
  if (!Array.isArray(arr)) return [];
  return arr.map(item => translateTextToEnglish(item)).filter(Boolean);
}

/**
 * Guardrail Post-Processing Helper
 * Strips out specific diagnostic/medication terms to prevent unauthorized medical outputs
 */
function stripPrescriptiveLanguage(text) {
  if (!text) return '';
  let cleaned = text;
  
  const illegalTerms = [
    /diagnose[d]?\s+with/gi, /prescribe[d]?/gi, /should\s+take/gi, /recommend\s+taking/gi,
    /malaria/gi, /pre-eclampsia/gi, /pneumonia/gi, /anemia/gi, /cholera/gi, /hypertension/gi,
    /paracetamol/gi, /antibiotic[s]?/gi, /ibuprofen/gi, /aspirin/gi, /amoxicillin/gi
  ];
  
  illegalTerms.forEach(term => {
    cleaned = cleaned.replace(term, '[clinical observation flags]');
  });
  
  return cleaned;
}
