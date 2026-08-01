import { repository } from '../utils/repository.js';
import { runExtractor, runRiskScorer, runReportWriter } from '../services/ai.js';
import { pipelineEvents } from '../utils/pipelineEvents.js';

export async function runVisitPipeline({ householdId, workerId, rawTranscript, inputMode = 'typed', sessionId = null }) {
  const trace = [];
  const startTimestamp = new Date();

  // Helper to push to trace
  const logTrace = (stage, input, output) => {
    trace.push({
      stage,
      input,
      output,
      timestamp: new Date()
    });
  };

  // Helper to emit real-time pipeline state via SSE
  const emitStage = (stage, status, summary) => {
    if (sessionId) {
      pipelineEvents.emit(sessionId, {
        stage,
        status,
        summary,
        timestamp: new Date().toISOString()
      });
    }
  };

  // 1. Fetch household and worker context
  const household = await repository.getById('Household', householdId);
  if (!household) {
    throw new Error('Household not found.');
  }

  const worker = await repository.getById('User', workerId);
  const workerName = worker ? worker.name : 'Assigned Health Worker';

  console.log(`🤖 Starting 5-Stage Agentic Pipeline for visit at household: "${household.name}"`);

  // --- STAGE 1: EXTRACTOR ---
  emitStage('EXTRACTOR', 'active', 'Parsing regional language transcript...');
  const extInput = { transcript: rawTranscript, categoryPref: household.category };
  const extOutput = await runExtractor(rawTranscript, household.category);
  logTrace('Extractor', extInput, extOutput);
  emitStage('EXTRACTOR', extOutput.source === 'fallback' ? 'fallback' : 'complete', 
    extOutput.source === 'fallback' ? 'Offline regex-based structural extraction completed.' : `Observations extracted for category: ${extOutput.category.toUpperCase()}`);

  // --- STAGE 2: RISK SCORER ---
  emitStage('RISK_SCORER', 'active', 'Applying clinical triage rubric...');
  const scorerInput = { extractedData: extOutput };
  const scorerOutput = await runRiskScorer(extOutput);
  logTrace('Risk Scorer', scorerInput, scorerOutput);
  emitStage('RISK_SCORER', scorerOutput.source === 'fallback' ? 'fallback' : 'complete', 
    scorerOutput.source === 'fallback' ? 'Triage priority resolved via heuristic scoring.' : `Triage priority: ${scorerOutput.riskLevel.toUpperCase()} determined.`);

  // --- STAGE 2.5: AUTO-ESCALATION PATTERN DETECTION ---
  let autoEscalated = false;
  try {
    const pastVisits = await repository.getAll('Visit', { householdId });
    // Sort newest first
    const sortedPast = pastVisits
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
      .slice(0, 3);

    if (sortedPast.length >= 3) {
      const allFlagged = sortedPast.every(v => ['medium', 'high', 'critical'].includes(String(v.riskLevel).toLowerCase()));
      if (allFlagged) {
        emitStage('PATTERN_DETECTION', 'complete', '⚠ Pattern escalation triggered — consecutive risk visits flagged');
        if (scorerOutput.riskLevel === 'medium') {
          scorerOutput.riskLevel = 'high';
          autoEscalated = true;
          
          if (!extOutput.riskIndicators) extOutput.riskIndicators = [];
          extOutput.riskIndicators.push("Pattern escalation: 3 consecutive flagged visits detected — automatic risk upgrade applied");
          
          trace.push({
            stage: "AUTO_ESCALATION_RULE",
            status: "triggered",
            summary: "Risk upgraded from medium to high due to 3-visit consecutive pattern",
            timestamp: new Date()
          });
        }
      } else {
        emitStage('PATTERN_DETECTION', 'complete', 'No pattern escalation triggered');
      }
    } else {
      emitStage('PATTERN_DETECTION', 'complete', 'No pattern escalation triggered (insufficient history)');
    }
  } catch (err) {
    console.warn('⚠️ Pattern escalation check failed:', err.message);
    emitStage('PATTERN_DETECTION', 'complete', 'Pattern detection check skipped due to error');
  }

  // --- STAGE 3: REPORT WRITER ---
  emitStage('REPORT_WRITER', 'active', 'Generating official English report...');
  const writerInput = { extractedData: extOutput, riskOutput: scorerOutput, householdName: household.name, workerName };
  const writerOutput = await runReportWriter(extOutput, scorerOutput, household.name, workerName);
  logTrace('Report Writer', writerInput, writerOutput);
  emitStage('REPORT_WRITER', writerOutput.source === 'fallback' ? 'fallback' : 'complete', 
    writerOutput.source === 'fallback' ? 'Official template-fill report written.' : 'Clinical visit summary successfully compiled.');

  // --- STAGE 4: ESCALATION EVALUATOR ---
  emitStage('ESCALATION_EVALUATOR', 'active', 'Evaluating escalation threshold...');
  const riskLevel = scorerOutput.riskLevel;
  let isEscalated = false;
  let escalationId = null;

  const escInput = { riskLevel, supervisorId: worker ? worker.supervisorId : null };
  const escOutput = { escalated: false, escalationRecord: null };

  if (['high', 'critical'].includes(riskLevel) && worker && worker.supervisorId) {
    // Create the Escalation record in database
    const escalation = await repository.create('Escalation', {
      visitId: null, // Will update this with the created visit's ID in next step
      supervisorId: worker.supervisorId,
      resolved: false,
      resolvedAt: null
    });
    isEscalated = true;
    escalationId = escalation._id || escalation.id;
    
    escOutput.escalated = true;
    escOutput.escalationRecord = escalation;
    console.log(`⚠️ Escalation Evaluator triggered. Escalated to supervisor ID: ${worker.supervisorId}`);
  }
  logTrace('Escalation Evaluator', escInput, escOutput);
  emitStage('ESCALATION_EVALUATOR', 'complete', isEscalated ? 'Clinical escalation filed to supervising PHC.' : 'Risk below escalation priority, review stored.');

  // --- STAGE 5: TRACE LOGGER ---
  emitStage('TRACE_LOGGER', 'active', 'Recording audit trail...');
  // The trace array compiles all logs we've generated, and is recorded on the saved Visit.
  const traceInput = { traceLength: trace.length };
  const traceOutput = { status: 'Trace logs compiled successfully' };
  logTrace('Trace Logger', traceInput, traceOutput);
  emitStage('TRACE_LOGGER', 'complete', 'Visit trace logs fully audited and sealed.');

  // 2. Assemble and save the final Visit
  const visitData = {
    householdId,
    workerId,
    timestamp: startTimestamp,
    inputMode,
    rawTranscript,
    extractedData: {
      observations: extOutput.observations || [],
      riskIndicators: extOutput.riskIndicators || [],
      followUpNeeded: extOutput.followUpNeeded || 'no',
      followUpReason: extOutput.followUpReason || ''
    },
    riskLevel,
    riskJustification: scorerOutput.riskJustification || '',
    report: writerOutput,
    status: isEscalated ? 'escalated' : 'reviewed',
    trace
  };

  const savedVisit = await repository.create('Visit', visitData);
  const visitId = savedVisit._id || savedVisit.id;

  // 3. Link Escalation to the newly created Visit ID
  if (isEscalated && escalationId) {
    await repository.updateById('Escalation', escalationId, { visitId });
  }

  console.log(`✅ Visit pipeline execution completed. Visit ID saved: ${visitId}`);
  return savedVisit;
}
