const PptxGenJS = require('pptxgenjs');
const pres = new PptxGenJS();

// Set 16:9 widescreen layout (10" × 5.625" as requested)
pres.layout = 'LAYOUT_16x9';

// Define Color Tokens (Hex colors without # prefix)
const NAVY = '0F2044';
const TEAL = '0D7A6F';
const TEAL_LIGHT = '13B5A6';
const TEAL_PALE = 'E0F5F3';
const WHITE = 'FFFFFF';
const OFF_WHITE = 'F4F6F9';
const TEXT_PRIMARY = '0A1628';
const TEXT_MUTED = '6B7280';
const SHADOW_COLOR = 'E2E8F0';

const RISK_CRITICAL = 'DC2626';
const RISK_HIGH = 'EA580C';
const RISK_MEDIUM = 'CA8A04';
const RISK_LOW = '16A34A';

// ==========================================
// SLIDE 1: TITLE SLIDE
// ==========================================
const s1 = pres.addSlide();
s1.background = { fill: NAVY };

// Visual Anchor Block (Top-left)
s1.addShape(pres.shapes.RECTANGLE, { x: 0.4, y: 0.4, w: 0.4, h: 0.4, fill: { color: WHITE } });
s1.addShape(pres.shapes.RECTANGLE, { x: 0.45, y: 0.45, w: 0.3, h: 0.3, fill: { color: NAVY } });

// Center Text (with margin: 0 to align with shapes)
s1.addText("Sahayak AI", { x: 1.0, y: 1.3, w: 8.0, h: 0.8, fontSize: 52, bold: true, color: WHITE, align: 'center', margin: 0 });
s1.addText("AI-Powered Decision Support for India's", { x: 1.0, y: 2.3, w: 8.0, h: 0.4, fontSize: 22, color: TEAL_LIGHT, align: 'center', margin: 0 });
s1.addText("Frontline Health Workers", { x: 1.0, y: 2.75, w: 8.0, h: 0.4, fontSize: 22, color: TEAL_LIGHT, align: 'center', margin: 0 });

// Thin line (under titles, centered)
s1.addShape(pres.shapes.RECTANGLE, { x: 3.5, y: 3.35, w: 3.0, h: 0.02, fill: { color: TEAL } });

// Hackathon subtitle
s1.addText("NxtWave Idea2Impact 2026 Hackathon  ·  Theme: AI for Industry & Public Impact", { x: 1.0, y: 3.55, w: 8.0, h: 0.3, fontSize: 13, color: WHITE, align: 'center', margin: 0 });
s1.addText("Healthcare & Public Services Track", { x: 1.0, y: 3.85, w: 8.0, h: 0.3, fontSize: 13, color: TEAL_LIGHT, align: 'center', margin: 0 });

// Stat Chips (Bottom right/centered)
s1.addShape(pres.shapes.ROUNDED_RECTANGLE, { x: 2.5, y: 4.6, w: 1.5, h: 0.45, fill: { color: TEAL_PALE } });
s1.addText("980K Workers", { x: 2.5, y: 4.6, w: 1.5, h: 0.45, fontSize: 11, bold: true, color: NAVY, align: 'center', valign: 'middle', margin: 0 });

s1.addShape(pres.shapes.ROUNDED_RECTANGLE, { x: 4.25, y: 4.6, w: 1.5, h: 0.45, fill: { color: TEAL_PALE } });
s1.addText("600M+ Served", { x: 4.25, y: 4.6, w: 1.5, h: 0.45, fontSize: 11, bold: true, color: NAVY, align: 'center', valign: 'middle', margin: 0 });

s1.addShape(pres.shapes.ROUNDED_RECTANGLE, { x: 6.0, y: 4.6, w: 1.5, h: 0.45, fill: { color: TEAL_PALE } });
s1.addText("20% Staffed", { x: 6.0, y: 4.6, w: 1.5, h: 0.45, fontSize: 11, bold: true, color: NAVY, align: 'center', valign: 'middle', margin: 0 });

s1.addNotes("Good morning. I'm going to tell you about 980,000 people who hold India's rural health system together — and the one thing they've never had: a tool that actually helps them instead of adding more work.");


// ==========================================
// SLIDE 2: THE PROBLEM
// ==========================================
const s2 = pres.addSlide();
s2.background = { fill: OFF_WHITE };

// Header
s2.addText("The Problem", { x: 0.4, y: 0.4, w: 5.5, h: 0.5, fontSize: 32, bold: true, color: TEAL, margin: 0 });
s2.addText("980,000 workers. No decision support. No way to know who needs help most.", { x: 0.4, y: 0.95, w: 5.5, h: 0.6, fontSize: 16, color: TEXT_PRIMARY, margin: 0 });

// Bold Stat Boxes (only 2 to prevent crowding)
s2.addShape(pres.shapes.RECTANGLE, { x: 6.2, y: 0.35, w: 1.6, h: 1.1, fill: { color: RISK_CRITICAL } });
s2.addText("~20%", { x: 6.2, y: 0.42, w: 1.6, h: 0.45, fontSize: 28, bold: true, color: WHITE, align: 'center', margin: 0 });
s2.addText("functional staffing", { x: 6.2, y: 0.88, w: 1.6, h: 0.3, fontSize: 10, color: WHITE, align: 'center', margin: 0 });

s2.addShape(pres.shapes.RECTANGLE, { x: 7.95, y: 0.35, w: 1.6, h: 1.1, fill: { color: RISK_HIGH } });
s2.addText("600M+", { x: 7.95, y: 0.42, w: 1.6, h: 0.45, fontSize: 28, bold: true, color: WHITE, align: 'center', margin: 0 });
s2.addText("rural Indians at risk", { x: 7.95, y: 0.88, w: 1.6, h: 0.3, fontSize: 10, color: WHITE, align: 'center', margin: 0 });

// Divider line
s2.addShape(pres.shapes.RECTANGLE, { x: 0.4, y: 1.65, w: 9.2, h: 0.02, fill: { color: TEAL_PALE } });

// 2x2 Problem Cards
function addProblemCard(slide, x, y, icon, title, body) {
  // Card Shadow (subtle offset rectangle)
  slide.addShape(pres.shapes.RECTANGLE, { x: x + 0.04, y: y + 0.04, w: 4.5, h: 1.45, fill: { color: SHADOW_COLOR } });
  // Card Base
  slide.addShape(pres.shapes.RECTANGLE, { x: x, y: y, w: 4.5, h: 1.45, fill: { color: WHITE } });
  // Icon Area (small red circle)
  slide.addShape(pres.shapes.OVAL, { x: x + 0.2, y: y + 0.18, w: 0.32, h: 0.32, fill: { color: RISK_CRITICAL } });
  slide.addText(icon, { x: x + 0.2, y: y + 0.18, w: 0.32, h: 0.32, fontSize: 12, bold: true, color: WHITE, align: 'center', valign: 'middle', margin: 0 });
  // Card Title
  slide.addText(title, { x: x + 0.65, y: y + 0.16, w: 3.6, h: 0.3, fontSize: 14, bold: true, color: NAVY, margin: 0 });
  // Card Body
  slide.addText(body, { x: x + 0.2, y: y + 0.58, w: 4.1, h: 0.75, fontSize: 11, color: TEXT_MUTED, margin: 0 });
}

addProblemCard(s2, 0.4, 1.8, "⚠", "Manual Form-Filling", "Existing apps demand typed English forms after every visit. Workers spend more time on paperwork than patients.");
addProblemCard(s2, 5.1, 1.8, "?", "Zero Prioritization", "No tool tells a worker which household needs her most urgently. She triages 500+ homes from memory, daily.");
addProblemCard(s2, 0.4, 3.45, "✗", "Language Barrier", "Every tool is English-only. Workers who speak Telugu, Hindi, Tamil cannot use them naturally.");
addProblemCard(s2, 5.1, 3.45, "!", "Late Detection", "Missed immunizations, malnourished children, TB dropouts — detected only after they become emergencies.");

// Bottom Navy Strip
s2.addShape(pres.shapes.RECTANGLE, { x: 0, y: 5.1, w: 10.0, h: 0.525, fill: { color: NAVY } });
s2.addText("Existing tools added more burden. None reduced it.", { x: 0, y: 5.2, w: 10.0, h: 0.3, fontSize: 13, bold: true, color: WHITE, align: 'center', margin: 0 });

s2.addNotes("Three ANM workers covering 150,000 people. The norm is 15. They have no system to tell them who is in danger today. Poshan Tracker, eSanjeevani — these tools require manual form-filling in English after every visit. They digitized the old broken process. We replace it.");


// ==========================================
// SLIDE 3: THE HUMAN STORY
// ==========================================
const s3 = pres.addSlide();
// Achieve split background
s3.addShape(pres.shapes.RECTANGLE, { x: 0, y: 0, w: 4.8, h: 5.625, fill: { color: NAVY } });
s3.addShape(pres.shapes.RECTANGLE, { x: 4.8, y: 0, w: 5.2, h: 5.625, fill: { color: OFF_WHITE } });

// Left half Content
s3.addText('"', { x: 0.3, y: 0.2, w: 1.0, h: 0.8, fontSize: 80, bold: true, color: TEAL, margin: 0 });
s3.addText("I cover more than 500 households.\nAfter every visit, I fill forms for\n30 minutes. By the time I finish,\nI've forgotten who was most at risk.", { x: 0.4, y: 1.1, w: 4.2, h: 2.2, fontSize: 15, italic: true, color: WHITE, margin: 0 });

s3.addText("— Rani, ANM Worker", { x: 0.4, y: 3.5, w: 4.2, h: 0.3, fontSize: 13, bold: true, color: TEAL_LIGHT, margin: 0 });
s3.addText("Primary Health Centre, Rural Telangana", { x: 0.4, y: 3.8, w: 4.2, h: 0.3, fontSize: 11, color: 'CCCCCC', margin: 0 });
s3.addText("Covering 10× her sanctioned caseload", { x: 0.4, y: 4.1, w: 4.2, h: 0.3, fontSize: 12, bold: true, color: RISK_CRITICAL, margin: 0 });

// Right half Content
s3.addText("This is not one person.", { x: 5.1, y: 0.4, w: 4.5, h: 0.4, fontSize: 22, bold: true, color: NAVY, margin: 0 });
s3.addText("This is India's entire rural health backbone.", { x: 5.1, y: 0.82, w: 4.5, h: 0.35, fontSize: 13, color: TEAL, margin: 0 });

// Stat Rows
s3.addText("980,000", { x: 5.1, y: 1.3, w: 1.8, h: 0.7, fontSize: 34, bold: true, color: NAVY, margin: 0 });
s3.addText("ASHA & ANM workers nationally", { x: 7.1, y: 1.5, w: 2.5, h: 0.4, fontSize: 12, color: TEXT_MUTED, margin: 0 });

s3.addShape(pres.shapes.RECTANGLE, { x: 5.1, y: 2.15, w: 4.2, h: 0.02, fill: { color: TEAL_PALE } });

s3.addText("~20%", { x: 5.1, y: 2.3, w: 1.8, h: 0.7, fontSize: 34, bold: true, color: RISK_CRITICAL, margin: 0 });
s3.addText("functional staffing vs guideline", { x: 7.1, y: 2.5, w: 2.5, h: 0.4, fontSize: 12, color: TEXT_MUTED, margin: 0 });

s3.addShape(pres.shapes.RECTANGLE, { x: 5.1, y: 3.15, w: 4.2, h: 0.02, fill: { color: TEAL_PALE } });

s3.addText("0", { x: 5.1, y: 3.3, w: 1.8, h: 0.7, fontSize: 34, bold: true, color: NAVY, margin: 0 });
s3.addText("tools that help her know who to see first", { x: 7.1, y: 3.4, w: 2.5, h: 0.5, fontSize: 12, color: TEXT_MUTED, margin: 0 });

// Bottom Callout Box
s3.addShape(pres.shapes.RECTANGLE, { x: 5.1, y: 4.25, w: 4.5, h: 0.9, fill: { color: TEAL_PALE } });
s3.addText("Sahayak AI changes exactly one thing:\nShe speaks. We handle the rest.", { x: 5.1, y: 4.25, w: 4.5, h: 0.9, fontSize: 12, bold: true, color: NAVY, align: 'center', valign: 'middle', margin: 0 });

s3.addNotes("Rani is not a fictional character. She represents the reality of 980,000 workers. The zero on the right is the most important number on this slide — zero tools that tell her who needs her first today. Until now.");


// ==========================================
// SLIDE 4: THE SOLUTION
// ==========================================
const s4 = pres.addSlide();
s4.background = { fill: WHITE };

s4.addText("Sahayak AI — How It Works", { x: 0.4, y: 0.3, w: 8.0, h: 0.5, fontSize: 28, bold: true, color: NAVY, margin: 0 });
s4.addText("One 15-second voice note. Five AI stages. One prioritized action plan.", { x: 0.4, y: 0.85, w: 8.0, h: 0.4, fontSize: 14, color: TEAL, margin: 0 });

// Helper to draw horizontal steps
function drawStepCard(slide, x, num, title, body, fillCol, badgeText) {
  // Circular icon container above
  slide.addShape(pres.shapes.OVAL, { x: x + 0.45, y: 1.35, w: 0.65, h: 0.65, fill: { color: TEAL } });
  slide.addText(badgeText, { x: x + 0.45, y: 1.35, w: 0.65, h: 0.65, fontSize: 10, bold: true, color: WHITE, align: 'center', valign: 'middle', margin: 0 });
  
  // Card Box
  slide.addShape(pres.shapes.RECTANGLE, { x: x, y: 1.85, w: 1.55, h: 2.15, fill: { color: fillCol } });
  slide.addText(num, { x: x, y: 1.95, w: 1.55, h: 0.35, fontSize: 20, bold: true, color: TEAL_LIGHT, align: 'center', margin: 0 });
  slide.addText(title, { x: x, y: 2.3, w: 1.55, h: 0.3, fontSize: 12, bold: true, color: WHITE, align: 'center', margin: 0 });
  slide.addText(body, { x: x + 0.08, y: 2.65, w: 1.39, h: 1.2, fontSize: 9.5, color: WHITE, align: 'center', margin: 0 });
}

drawStepCard(s4, 0.35, "01", "SPEAK", "Worker speaks in her own regional language", NAVY, "🎤");
s4.addText("→", { x: 1.93, y: 2.6, w: 0.15, h: 0.4, fontSize: 18, bold: true, color: TEAL, align: 'center' });

drawStepCard(s4, 2.1, "02", "EXTRACT", "AI parses transcript into structured health data", "1A3461", "⚙");
s4.addText("→", { x: 3.68, y: 2.6, w: 0.15, h: 0.4, fontSize: 18, bold: true, color: TEAL, align: 'center' });

drawStepCard(s4, 3.85, "03", "SCORE RISK", "Critical / High / Medium / Low assigned instantly", TEAL, "⚡");
s4.addText("→", { x: 5.43, y: 2.6, w: 0.15, h: 0.4, fontSize: 18, bold: true, color: TEAL, align: 'center' });

drawStepCard(s4, 5.6, "04", "REPORT", "Formal English report generated automatically", "1A3461", "📝");
s4.addText("→", { x: 7.18, y: 2.6, w: 0.15, h: 0.4, fontSize: 18, bold: true, color: TEAL, align: 'center' });

drawStepCard(s4, 7.35, "05", "ESCALATE", "High-risk cases auto-sent to supervisor instantly", NAVY, "🔔");

// Bottom Badges
s4.addShape(pres.shapes.ROUNDED_RECTANGLE, { x: 0.35, y: 4.4, w: 2.8, h: 0.45, fill: { color: TEAL_PALE } });
s4.addText("✓ Works in 10+ Indian Languages", { x: 0.35, y: 4.4, w: 2.8, h: 0.45, fontSize: 11, bold: true, color: NAVY, align: 'center', valign: 'middle', margin: 0 });

s4.addShape(pres.shapes.ROUNDED_RECTANGLE, { x: 3.5, y: 4.4, w: 2.8, h: 0.45, fill: { color: TEAL_PALE } });
s4.addText("✓ Under 10 Seconds End-to-End", { x: 3.5, y: 4.4, w: 2.8, h: 0.45, fontSize: 11, bold: true, color: NAVY, align: 'center', valign: 'middle', margin: 0 });

s4.addShape(pres.shapes.ROUNDED_RECTANGLE, { x: 6.65, y: 4.4, w: 2.8, h: 0.45, fill: { color: TEAL_PALE } });
s4.addText("✓ Works Fully Offline", { x: 6.65, y: 4.4, w: 2.8, h: 0.45, fontSize: 11, bold: true, color: NAVY, align: 'center', valign: 'middle', margin: 0 });

s4.addNotes("The worker speaks naturally in Telugu or Hindi — the same way she'd describe a visit to a colleague. In under 10 seconds: the AI extracts structured data, scores the risk, generates a formal English report, and if it's Critical — alerts the supervisor automatically. No forms. No typing. No English required.");


// ==========================================
// SLIDE 5: AI PIPELINE
// ==========================================
const s5 = pres.addSlide();
s5.background = { fill: NAVY };

s5.addText("5-Stage Explainable AI Pipeline", { x: 0.4, y: 0.25, w: 8.0, h: 0.5, fontSize: 28, bold: true, color: WHITE, margin: 0 });
s5.addText("Every decision is transparent, traceable, and fallback-safe", { x: 0.4, y: 0.75, w: 8.0, h: 0.35, fontSize: 14, color: TEAL_LIGHT, margin: 0 });

// Vertical Pipeline Rows
function drawPipelineRow(slide, y, numTitle, mainText, fallbackText, fillCol, isTeal) {
  slide.addShape(pres.shapes.RECTANGLE, { x: 0.4, y: y, w: 9.2, h: 0.7, fill: { color: fillCol } });
  slide.addText(numTitle, { x: 0.6, y: y + 0.15, w: 2.2, h: 0.4, fontSize: 13, bold: true, color: isTeal ? WHITE : TEAL_LIGHT, margin: 0 });
  slide.addText(mainText, { x: 2.9, y: y + 0.15, w: 4.5, h: 0.4, fontSize: 10.5, color: WHITE, margin: 0 });
  slide.addText(fallbackText, { x: 7.5, y: y + 0.15, w: 2.0, h: 0.4, fontSize: 10, color: isTeal ? TEAL_PALE : TEAL_LIGHT, align: 'right', margin: 0 });
}

drawPipelineRow(s5, 1.2, "01  EXTRACTOR", "Regional language transcript → structured JSON (category, observations, risk indicators)", "Fallback: regex keyword matching", "1A3461", false);
drawPipelineRow(s5, 1.95, "02  RISK SCORER", "Structured data → Critical / High / Medium / Low + one-sentence justification", "Fallback: rule engine guidelines", "1A3461", false);
drawPipelineRow(s5, 2.7, "03  REPORT WRITER", "Generates formal English report regardless of input language — zero translation step required", "Fallback: field template filler", TEAL, true);
drawPipelineRow(s5, 3.45, "04  ESCALATION EVAL", "High/Critical → Escalation record created, supervisor notified in real time.", "No AI dependency (pure logic)", "1A3461", false);
drawPipelineRow(s5, 4.2, "05  TRACE LOGGER", "Full audit trail stored per visit — every field tagged AI or Fallback.", "Always runs — no failure mode", "1A3461", false);

s5.addNotes("This is not a black box. Every single decision the system makes is logged, tagged as AI or fallback, and inspectable. If a judge asks 'what if the AI is wrong?' — the worker reviews and edits every field before saving. The human is always the final decision-maker. The AI reduces burden and improves prioritization. It never replaces judgment.");


// ==========================================
// SLIDE 6: LANGUAGE & MULTILINGUAL
// ==========================================
const s6 = pres.addSlide();
s6.background = { fill: OFF_WHITE };

s6.addText("Speaks Her Language. Reports in English.", { x: 0.4, y: 0.3, w: 8.0, h: 0.5, fontSize: 28, bold: true, color: NAVY, margin: 0 });
s6.addText("The first health worker tool with true regional language voice input", { x: 0.4, y: 0.85, w: 8.0, h: 0.4, fontSize: 14, color: TEAL, margin: 0 });

// Left Translation Flow Column
s6.addShape(pres.shapes.RECTANGLE, { x: 0.4, y: 1.4, w: 4.2, h: 1.1, fill: { color: NAVY } });
s6.addText("WORKER SPEAKS (Telugu)", { x: 0.55, y: 1.5, w: 3.9, h: 0.2, fontSize: 10, bold: true, color: TEAL_LIGHT, margin: 0 });
s6.addText("మీన పిల్లవాడు, రెండవ సారి వచ్చాను, బరువు పెరగలేదు", { x: 0.55, y: 1.75, w: 3.9, h: 0.6, fontSize: 13, italic: true, color: WHITE, margin: 0 });

s6.addText("↓", { x: 2.4, y: 2.55, w: 0.2, h: 0.3, fontSize: 24, bold: true, color: TEAL, align: 'center', margin: 0 });

s6.addShape(pres.shapes.RECTANGLE, { x: 0.4, y: 2.9, w: 4.2, h: 0.7, fill: { color: TEAL_PALE } });
s6.addText("AI EXTRACTS", { x: 0.55, y: 2.95, w: 3.9, h: 0.2, fontSize: 10, bold: true, color: TEAL, margin: 0 });
s6.addText("Category: Child Nutrition | Risk: Weight stagnation, Missed immunization", { x: 0.55, y: 3.2, w: 3.9, h: 0.35, fontSize: 11, color: NAVY, margin: 0 });

s6.addText("↓", { x: 2.4, y: 3.65, w: 0.2, h: 0.3, fontSize: 24, bold: true, color: TEAL, align: 'center', margin: 0 });

s6.addShape(pres.shapes.RECTANGLE, { x: 0.4, y: 4.0, w: 4.2, h: 0.9, fill: { color: TEAL } });
s6.addText("REPORT GENERATED (English)", { x: 0.55, y: 4.05, w: 3.9, h: 0.2, fontSize: 10, bold: true, color: WHITE, margin: 0 });
s6.addText("Triage: CRITICAL | Weight not gaining — 2nd consecutive visit. Immunization missed.", { x: 0.55, y: 4.3, w: 3.9, h: 0.55, fontSize: 12, color: WHITE, margin: 0 });

// Right Grid Column
s6.addText("10+ Languages Supported", { x: 5.1, y: 1.35, w: 4.5, h: 0.35, fontSize: 16, bold: true, color: NAVY, margin: 0 });

function addLanguagePill(slide, x, y, text) {
  slide.addShape(pres.shapes.ROUNDED_RECTANGLE, { x: x, y: y, w: 2.0, h: 0.43, fill: { color: WHITE }, line: { color: TEAL, width: 1 } });
  slide.addText(text, { x: x, y: y, w: 2.0, h: 0.43, fontSize: 10.5, bold: true, color: NAVY, align: 'center', valign: 'middle', margin: 0 });
}

addLanguagePill(s6, 5.1, 1.85, "हिन्दी Hindi");
addLanguagePill(s6, 7.3, 1.85, "తెలుగు Telugu");
addLanguagePill(s6, 5.1, 2.4, "தமிழ் Tamil");
addLanguagePill(s6, 7.3, 2.4, "ಕನ್ನಡ Kannada");
addLanguagePill(s6, 5.1, 2.95, "മലയാളം Malayalam");
addLanguagePill(s6, 7.3, 2.95, "मराठी Marathi");
addLanguagePill(s6, 5.1, 3.5, "বাংলা Bengali");
addLanguagePill(s6, 7.3, 3.5, "ગુજરાતી Gujarati");
addLanguagePill(s6, 5.1, 4.05, "ਪੰਜਾਬੀ Punjabi");
addLanguagePill(s6, 7.3, 4.05, "English");

s6.addText("Original transcript preserved in regional language. All reports output in English.", { x: 5.1, y: 4.65, w: 4.2, h: 0.35, fontSize: 11, italic: true, color: TEXT_MUTED, margin: 0 });

s6.addNotes("Every existing government health app requires English. Rani speaks Telugu. The app now speaks Telugu back. She selects her language in native script — she doesn't need to read English to find it. She speaks naturally. The report comes out in clean English for her supervisor. This is the language bridge that has never existed before.");


// ==========================================
// SLIDE 7: LIVE DEMO SLIDE
// ==========================================
const s7 = pres.addSlide();
s7.background = { fill: NAVY };

s7.addText("Live Demo", { x: 1.0, y: 0.4, w: 8.0, h: 0.5, fontSize: 36, bold: true, color: WHITE, align: 'center', margin: 0 });
s7.addText("Watch a 15-second voice note become a CRITICAL escalation report", { x: 1.0, y: 1.0, w: 8.0, h: 0.4, fontSize: 16, color: TEAL_LIGHT, align: 'center', margin: 0 });

// Center Large Demo Instruction Box
s7.addShape(pres.shapes.RECTANGLE, { x: 1.5, y: 1.7, w: 7.0, h: 1.5, fill: { color: '1A3461' }, line: { color: TEAL, width: 2 } });
s7.addText("SPEAK THIS SENTENCE (Telugu):", { x: 1.5, y: 1.85, w: 7.0, h: 0.25, fontSize: 12, bold: true, color: TEAL_LIGHT, align: 'center', margin: 0 });
s7.addText("మీన పిల్లవాడు, రెండవ సారి వచ్చాను, బరువు ఇంకా పెరగలేదు, అమ్మ చెప్పింది చివరి టీకా వేయలేదు అని.", { x: 1.6, y: 2.15, w: 6.8, h: 0.45, fontSize: 13, bold: true, color: WHITE, align: 'center', margin: 0 });
s7.addText("(Meena's child, 2nd visit, weight not gaining, mother says last vaccine was missed)", { x: 1.5, y: 2.65, w: 7.0, h: 0.35, fontSize: 11, italic: true, color: TEAL_LIGHT, align: 'center', margin: 0 });

// Expected Result Box (Left & Right Split)
s7.addShape(pres.shapes.RECTANGLE, { x: 0.5, y: 3.4, w: 2.5, h: 1.5, fill: { color: RISK_CRITICAL } });
s7.addText("CRITICAL", { x: 0.5, y: 3.65, w: 2.5, h: 0.5, fontSize: 30, bold: true, color: WHITE, align: 'center', margin: 0 });
s7.addText("Risk Level", { x: 0.5, y: 4.15, w: 2.5, h: 0.3, fontSize: 11, color: WHITE, align: 'center', margin: 0 });

s7.addShape(pres.shapes.RECTANGLE, { x: 3.0, y: 3.4, w: 6.5, h: 1.5, fill: { color: '1A3461' } });
s7.addText("✓ Transcript captured in Telugu", { x: 3.2, y: 3.52, w: 6.1, h: 0.3, fontSize: 11.5, color: TEAL_LIGHT, margin: 0 });
s7.addText("✓ Structured data extracted", { x: 3.2, y: 3.82, w: 6.1, h: 0.3, fontSize: 11.5, color: TEAL_LIGHT, margin: 0 });
s7.addText("✓ Formal English report generated", { x: 3.2, y: 4.12, w: 6.1, h: 0.3, fontSize: 11.5, color: TEAL_LIGHT, margin: 0 });
s7.addText("✓ Supervisor escalated in real time", { x: 3.2, y: 4.42, w: 6.1, h: 0.3, fontSize: 11.5, color: TEAL_LIGHT, margin: 0 });

// Bottom strip
s7.addText("⚡ Click LIVE DEMO MODE on the login screen", { x: 1.0, y: 5.05, w: 8.0, h: 0.3, fontSize: 12, bold: true, color: TEAL_PALE, align: 'center', margin: 0 });

s7.addNotes("[Click LIVE DEMO MODE on your laptop before this slide] Watch what happens when I speak one sentence in Telugu. [Speak the sentence. Point to the pipeline lighting up. Point to the CRITICAL badge appearing. Point to the English report. This takes under 10 seconds.]");


// ==========================================
// SLIDE 8: COMPETITIVE ADVANTAGE
// ==========================================
const s8 = pres.addSlide();
s8.background = { fill: WHITE };

s8.addText("Why Nothing Else Does This", { x: 0.4, y: 0.3, w: 8.0, h: 0.5, fontSize: 28, bold: true, color: NAVY, margin: 0 });

// Custom styled comparison table
const colW = [2.8, 1.65, 1.65, 1.65, 1.65];
const tableData = [
  [
    { text: "Feature", options: { fill: NAVY, color: WHITE, bold: true, fontSize: 11.5 } },
    { text: "Poshan Tracker", options: { fill: NAVY, color: WHITE, bold: true, fontSize: 11.5, align: 'center' } },
    { text: "eSanjeevani", options: { fill: NAVY, color: WHITE, bold: true, fontSize: 11.5, align: 'center' } },
    { text: "Existing Apps", options: { fill: NAVY, color: WHITE, bold: true, fontSize: 11.5, align: 'center' } },
    { text: "Sahayak AI", options: { fill: NAVY, color: WHITE, bold: true, fontSize: 11.5, align: 'center' } }
  ],
  [
    { text: "Voice input in regional language", options: { fill: OFF_WHITE, fontSize: 10.5 } },
    { text: "✗", options: { fill: OFF_WHITE, color: RISK_CRITICAL, bold: true, align: 'center', fontSize: 13 } },
    { text: "✗", options: { fill: OFF_WHITE, color: RISK_CRITICAL, bold: true, align: 'center', fontSize: 13 } },
    { text: "✗", options: { fill: OFF_WHITE, color: RISK_CRITICAL, bold: true, align: 'center', fontSize: 13 } },
    { text: "✓ 10+ lang", options: { fill: TEAL_PALE, color: TEAL, bold: true, align: 'center', fontSize: 11 } }
  ],
  [
    { text: "Tells worker who to visit first", options: { fill: WHITE, fontSize: 10.5 } },
    { text: "✗", options: { fill: WHITE, color: RISK_CRITICAL, bold: true, align: 'center', fontSize: 13 } },
    { text: "✗", options: { fill: WHITE, color: RISK_CRITICAL, bold: true, align: 'center', fontSize: 13 } },
    { text: "✗", options: { fill: WHITE, color: RISK_CRITICAL, bold: true, align: 'center', fontSize: 13 } },
    { text: "✓ Prioritized", options: { fill: TEAL_PALE, color: TEAL, bold: true, align: 'center', fontSize: 11 } }
  ],
  [
    { text: "Auto-generates English report", options: { fill: OFF_WHITE, fontSize: 10.5 } },
    { text: "✗", options: { fill: OFF_WHITE, color: RISK_CRITICAL, bold: true, align: 'center', fontSize: 13 } },
    { text: "✗", options: { fill: OFF_WHITE, color: RISK_CRITICAL, bold: true, align: 'center', fontSize: 13 } },
    { text: "✗", options: { fill: OFF_WHITE, color: RISK_CRITICAL, bold: true, align: 'center', fontSize: 13 } },
    { text: "✓ From Speech", options: { fill: TEAL_PALE, color: TEAL, bold: true, align: 'center', fontSize: 11 } }
  ],
  [
    { text: "Works fully offline", options: { fill: WHITE, fontSize: 10.5 } },
    { text: "✗", options: { fill: WHITE, color: RISK_CRITICAL, bold: true, align: 'center', fontSize: 13 } },
    { text: "✗", options: { fill: WHITE, color: RISK_CRITICAL, bold: true, align: 'center', fontSize: 13 } },
    { text: "Partial", options: { fill: WHITE, color: TEXT_MUTED, align: 'center', fontSize: 10.5 } },
    { text: "✓ Full fallback", options: { fill: TEAL_PALE, color: TEAL, bold: true, align: 'center', fontSize: 11 } }
  ],
  [
    { text: "Reduces paperwork burden", options: { fill: OFF_WHITE, fontSize: 10.5 } },
    { text: "✗ Adds", options: { fill: OFF_WHITE, color: RISK_CRITICAL, bold: true, align: 'center', fontSize: 10.5 } },
    { text: "✗ Adds", options: { fill: OFF_WHITE, color: RISK_CRITICAL, bold: true, align: 'center', fontSize: 10.5 } },
    { text: "✗ Adds", options: { fill: OFF_WHITE, color: RISK_CRITICAL, bold: true, align: 'center', fontSize: 10.5 } },
    { text: "✓ Core Goal", options: { fill: TEAL_PALE, color: TEAL, bold: true, align: 'center', fontSize: 11 } }
  ],
  [
    { text: "Pattern detection across visits", options: { fill: WHITE, fontSize: 10.5 } },
    { text: "✗", options: { fill: WHITE, color: RISK_CRITICAL, bold: true, align: 'center', fontSize: 13 } },
    { text: "✗", options: { fill: WHITE, color: RISK_CRITICAL, bold: true, align: 'center', fontSize: 13 } },
    { text: "✗", options: { fill: WHITE, color: RISK_CRITICAL, bold: true, align: 'center', fontSize: 13 } },
    { text: "✓ Escalates", options: { fill: TEAL_PALE, color: TEAL, bold: true, align: 'center', fontSize: 11 } }
  ],
  [
    { text: "Explainable AI audit trail", options: { fill: OFF_WHITE, fontSize: 10.5 } },
    { text: "✗", options: { fill: OFF_WHITE, color: RISK_CRITICAL, bold: true, align: 'center', fontSize: 13 } },
    { text: "✗", options: { fill: OFF_WHITE, color: RISK_CRITICAL, bold: true, align: 'center', fontSize: 13 } },
    { text: "✗", options: { fill: OFF_WHITE, color: RISK_CRITICAL, bold: true, align: 'center', fontSize: 13 } },
    { text: "✓ Transparent", options: { fill: TEAL_PALE, color: TEAL, bold: true, align: 'center', fontSize: 11 } }
  ]
];

s8.addTable(tableData, { x: 0.3, y: 1.0, colW: colW, rowH: 0.42, border: { color: 'E2E8F0', width: 1 } });

// Bottom Navy Card
s8.addShape(pres.shapes.RECTANGLE, { x: 0.3, y: 4.8, w: 9.4, h: 0.5, fill: { color: NAVY } });
s8.addText("Every competitor adds burden. Sahayak AI is the first to remove it.", { x: 0.3, y: 4.8, w: 9.4, h: 0.5, fontSize: 13.5, bold: true, color: WHITE, align: 'center', valign: 'middle', margin: 0 });

s8.addNotes("Every single government health app digitizes the old broken process. They take the paper form and put it on a screen. Sahayak AI is the first tool built around the worker's natural behavior — speak, don't type — and the first to give her output she can act on, not just data she has to submit.");


// ==========================================
// SLIDE 9: IMPACT AT SCALE
// ==========================================
const s9 = pres.addSlide();
s9.background = { fill: OFF_WHITE };

s9.addText("The Impact", { x: 0.4, y: 0.3, w: 8.0, h: 0.5, fontSize: 32, bold: true, color: NAVY, margin: 0 });
s9.addText("Built for 980,000 workers. Scales to 600 million people.", { x: 0.4, y: 0.85, w: 8.0, h: 0.4, fontSize: 15, color: TEAL, margin: 0 });

// Stat Cards
function addImpactCard(slide, x, fillCol, badge, number, detail, subText, textCol, subCol) {
  slide.addShape(pres.shapes.RECTANGLE, { x: x, y: 1.4, w: 2.9, h: 2.2, fill: { color: fillCol } });
  slide.addText(badge, { x: x + 0.2, y: 1.55, w: 2.5, h: 0.25, fontSize: 11, bold: true, color: subCol, margin: 0 });
  slide.addText(number, { x: x + 0.2, y: 1.8, w: 2.5, h: 0.65, fontSize: 36, bold: true, color: WHITE, margin: 0 });
  slide.addText(detail, { x: x + 0.2, y: 2.45, w: 2.5, h: 0.5, fontSize: 12, color: 'CCCCCC', margin: 0 });
  slide.addText(subText, { x: x + 0.2, y: 3.0, w: 2.5, h: 0.4, fontSize: 11, color: subCol, margin: 0 });
}

addImpactCard(s9, 0.4, NAVY, "⏱ SPEED", "10+ min", "saved per worker per visit", "Eliminated manual English form-filling", WHITE, TEAL_LIGHT);
addImpactCard(s9, 3.55, TEAL, "⚡ TRANSFORMATION", "<10 sec", "voice note to prioritized report", "End-to-end pipeline processing", WHITE, TEAL_PALE);
addImpactCard(s9, 6.7, NAVY, "🌐 REACH", "600M+", "rural Indians covered by ASHA", "If every worker uses Sahayak AI", WHITE, TEAL_LIGHT);

// Bottom Roadmap
function addPhaseBox(slide, x, title, sub, desc) {
  slide.addShape(pres.shapes.RECTANGLE, { x: x, y: 3.8, w: 2.8, h: 1.4, fill: { color: TEAL_PALE } });
  slide.addText(title, { x: x + 0.15, y: 3.9, w: 2.5, h: 0.25, fontSize: 11, bold: true, color: TEAL, margin: 0 });
  slide.addText(sub, { x: x + 0.15, y: 4.15, w: 2.5, h: 0.35, fontSize: 12.5, bold: true, color: NAVY, margin: 0 });
  slide.addText(desc, { x: x + 0.15, y: 4.5, w: 2.5, h: 0.6, fontSize: 10.5, color: TEXT_MUTED, margin: 0 });
}

addPhaseBox(s9, 0.4, "PHASE 1 — MONTHS 1-3", "50 workers, 1 district pilot", "Measure: time saved, cases detected");
s9.addText("→", { x: 3.32, y: 4.3, w: 0.15, h: 0.4, fontSize: 18, bold: true, color: TEAL });

addPhaseBox(s9, 3.55, "PHASE 2 — MONTHS 4-6", "ABDM integration, Bhashini", "Expand to 5 districts");
s9.addText("→", { x: 6.47, y: 4.3, w: 0.15, h: 0.4, fontSize: 18, bold: true, color: TEAL });

addPhaseBox(s9, 6.7, "PHASE 3 — YEAR 2", "State NHM rollout + licenses", "Revenue: govt per-worker license");

s9.addNotes("10 minutes of paperwork eliminated per visit. Multiply that by 980,000 workers. Multiply again by hundreds of visits per week. This is not incremental improvement — this is a structural change to how frontline healthcare operates in India. The pilot is 90 days, 50 workers, one district. We know exactly who to call.");


// ==========================================
// SLIDE 10: CLOSING SLIDE
// ==========================================
const s10 = pres.addSlide();
s10.background = { fill: NAVY };

s10.addText("980,000 workers.", { x: 1.0, y: 1.0, w: 8.0, h: 0.6, fontSize: 36, bold: true, color: WHITE, align: 'center', margin: 0 });
s10.addText("Zero tools that tell them who needs help first.", { x: 1.0, y: 1.6, w: 8.0, h: 0.5, fontSize: 22, color: TEAL_LIGHT, align: 'center', margin: 0 });

s10.addShape(pres.shapes.RECTANGLE, { x: 3.5, y: 2.3, w: 3.0, h: 0.02, fill: { color: TEAL } });

s10.addText("Until now.", { x: 1.0, y: 2.55, w: 8.0, h: 0.8, fontSize: 42, bold: true, color: WHITE, align: 'center', margin: 0 });

// Info Chips (Bottom)
function addInfoChip(slide, x, title, value) {
  slide.addShape(pres.shapes.ROUNDED_RECTANGLE, { x: x, y: 3.6, w: 2.5, h: 0.75, fill: { color: '1A3461' } });
  slide.addText(title, { x: x, y: 3.7, w: 2.5, h: 0.25, fontSize: 12, bold: true, color: TEAL_LIGHT, align: 'center', margin: 0 });
  slide.addText(value, { x: x, y: 3.98, w: 2.5, h: 0.25, fontSize: 9.5, color: WHITE, align: 'center', margin: 0 });
}

addInfoChip(s10, 1.0, "🌐 Live Demo", "https://sahayak-portal-nhm.vercel.app/");
addInfoChip(s10, 3.75, "👤 Login", "rani.worker@sahayak.ai");
addInfoChip(s10, 6.5, "🔑 Password", "Password@123");

s10.addText("Sahayak AI — NxtWave Hackathon", { x: 1.0, y: 4.8, w: 8.0, h: 0.35, fontSize: 13, color: TEAL, align: 'center', margin: 0 });

s10.addNotes("Every day, 980,000 Ranis go into the field with a paper register, a basic phone, and no system to help them decide who needs them first. We built Sahayak AI to change that. It takes 15 seconds to record. It works in their language. It works offline. And it tells them exactly what to do next. Thank you.");


// ==========================================
// SAVE THE PRESENTATION FILE
// ==========================================
pres.writeFile({ fileName: "Sahayak_AI_Pitch.pptx" })
  .then(() => {
    console.log("[SUCCESS] Compiled Sahayak_AI_Pitch.pptx successfully!");
  })
  .catch((err) => {
    console.error("[ERROR] Failed to save PPTX:", err);
    process.exit(1);
  });
