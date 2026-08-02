import { describe, test, expect, beforeAll } from 'vitest';
import { runVisitPipeline } from '../../server/src/agents/pipeline.js';
import { repository } from '../../server/src/utils/repository.js';
import { seedData } from '../../server/src/data/seed.js';

describe('Integration Tests - 5-Stage Agentic Pipeline & Auto-Escalation Rules', () => {
  const workerId = "rani_worker_static_id_2026";

  beforeAll(async () => {
    delete process.env.MONGODB_URI;
    await seedData();
  });

  test('Pipeline Run 1: Routine wellness visit does not trigger escalation', async () => {
    const uniqueHhId = "hh_integration_low_test_" + Date.now();
    await repository.create('Household', {
      _id: uniqueHhId,
      name: "Radha Devi",
      village: "Chandanpur",
      category: "general"
    });

    const visit = await runVisitPipeline({
      householdId: uniqueHhId,
      workerId,
      rawTranscript: "The family is happy. The children are playing outside and ate healthy meals.",
      inputMode: "typed"
    });

    expect(visit.riskLevel).toBe('low');
    expect(visit.status).toBe('reviewed');
    expect(visit.trace).toBeDefined();
    expect(visit.trace.length).toBeGreaterThan(0);
  });

  test('Pipeline Run 2: Critical visit triggers immediate supervisor escalation', async () => {
    const uniqueHhId = "hh_integration_critical_test_" + Date.now();
    await repository.create('Household', {
      _id: uniqueHhId,
      name: "Kamla Devi",
      village: "Ramapuram",
      category: "Maternal Health"
    });

    const visit = await runVisitPipeline({
      householdId: uniqueHhId,
      workerId,
      rawTranscript: "Severe pain in abdomen and bleeding since evening. Patient is very weak.",
      inputMode: "typed"
    });

    expect(visit.riskLevel).toBe('critical');
    expect(visit.status).toBe('escalated');
    
    // Check if the Escalation record was created in the repository
    const escalations = await repository.getAll('Escalation', { visitId: visit._id || visit.id });
    expect(escalations.length).toBeGreaterThan(0);
    expect(escalations[0].resolved).toBe(false);
  });

  test('Pipeline Run 3: Stage 2.5 Auto-Escalation triggers on 3 consecutive flagged visits', async () => {
    const uniqueHhId = "hh_integration_trend_test_" + Date.now();
    await repository.create('Household', {
      _id: uniqueHhId,
      name: "Baby Nitin",
      village: "Chandanpur",
      category: "Child Nutrition"
    });

    // Create 3 historical visits with "medium" risk
    for (let i = 0; i < 3; i++) {
      await repository.create('Visit', {
        householdId: uniqueHhId,
        workerId,
        riskLevel: 'medium',
        timestamp: new Date(Date.now() - (4 - i) * 24 * 60 * 60 * 1000) // progressive past days
      });
    }

    // Now record a new visit that would normally be evaluated as "medium" (kamzori / weakness)
    const currentVisit = await runVisitPipeline({
      householdId: uniqueHhId,
      workerId,
      rawTranscript: "The child feels weak and tired.", // triggers medium
      inputMode: "typed"
    });

    // Verify it was upgraded from "medium" to "high" due to the 3-visit consecutive trend pattern!
    expect(currentVisit.riskLevel).toBe('high');
    expect(currentVisit.extractedData.riskIndicators).toContain(
      "Pattern escalation: 3 consecutive flagged visits detected — automatic risk upgrade applied"
    );
  });
});
