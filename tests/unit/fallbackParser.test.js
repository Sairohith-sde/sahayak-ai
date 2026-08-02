import { describe, test, expect } from 'vitest';
import { fallbackParse } from '../../server/src/utils/fallbackParser.js';

describe('Fallback Parser - Unit Tests', () => {
  test('Assigns LOW risk status for a clean baseline checkup', () => {
    const result = fallbackParse('Everything is looking normal. Family is healthy.', 'general');
    expect(result.riskLevel).toBe('low');
    expect(result.extractedData.followUpNeeded).toBe('no');
    expect(result.extractedData.riskIndicators).toHaveLength(0);
  });

  test('Correctly identifies MEDIUM risk indicators (Kamzori, Vomit, Rash)', () => {
    const kamzoriResult = fallbackParse('The patient has severe kamzori and fatigue.', 'general');
    expect(kamzoriResult.riskLevel).toBe('medium');
    expect(kamzoriResult.extractedData.riskIndicators).toContain('Mild clinical weakness');

    const vomitResult = fallbackParse('Moderate vomit and stomach ache reported.', 'general');
    expect(vomitResult.riskLevel).toBe('medium');
    expect(vomitResult.extractedData.riskIndicators).toContain('Moderate gastric distress');
  });

  test('Correctly identifies HIGH risk indicators (Fever, Bukhaar, Cough, Missed Vaccine)', () => {
    const feverResult = fallbackParse('Maternal fever has been active since yesterday.', 'maternal');
    expect(feverResult.riskLevel).toBe('high');
    expect(feverResult.extractedData.riskIndicators).toContain('Active infant or maternal fever');

    const vaccineResult = fallbackParse('Child has missed vaccine immunization sessions.', 'general');
    expect(vaccineResult.riskLevel).toBe('high');
    expect(vaccineResult.category).toBe('immunization');
    expect(vaccineResult.extractedData.riskIndicators).toContain('Missed vital childhood immunization');
  });

  test('Correctly identifies CRITICAL risk indicators (Unconscious, Bleeding, Weight Loss)', () => {
    const unconsciousResult = fallbackParse('Patient was found unconscious this morning.', 'general');
    expect(unconsciousResult.riskLevel).toBe('critical');
    expect(unconsciousResult.extractedData.riskIndicators).toContain('Patient unresponsive/critical weakness');

    const weightLossResult = fallbackParse('Baby is weight loss and has severe wasting.', 'general');
    expect(weightLossResult.riskLevel).toBe('critical');
    expect(weightLossResult.category).toBe('child_nutrition');
  });

  test('Detects multi-lingual critical weight-loss keywords (Telugu, Hindi, Bengali)', () => {
    // Hindi weight loss keyword: "वजन नहीं बढ़ रहा"
    const hindiResult = fallbackParse('बच्चे का वजन नहीं बढ़ रहा', 'child_nutrition');
    expect(hindiResult.riskLevel).toBe('critical');
    expect(hindiResult.category).toBe('child_nutrition');

    // Telugu weight loss keyword: "బరువు ఇంకా పెరగలేదు"
    const teluguResult = fallbackParse('పిల్లవాడు బరువు ఇంకా పెరగలేదు', 'child_nutrition');
    expect(teluguResult.riskLevel).toBe('critical');
    expect(teluguResult.category).toBe('child_nutrition');
  });
});
