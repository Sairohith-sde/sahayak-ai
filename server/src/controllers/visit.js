import { repository } from '../utils/repository.js';
import { runVisitPipeline } from '../agents/pipeline.js';
import { pipelineEvents, sessionRequests } from '../utils/pipelineEvents.js';

export async function createVisit(req, res) {
  try {
    const { householdId, transcript, rawTranscript, inputMode } = req.body;
    const workerId = req.user._id || req.user.id;

    const actualTranscript = transcript || rawTranscript;
    if (!householdId || !actualTranscript) {
      return res.status(400).json({ message: 'Missing householdId or visit transcript text.' });
    }

    // Generate unique session ID for the stream
    const sessionId = 'session_' + Math.random().toString(36).substring(2) + '_' + Date.now();

    // In serverless environments, background promises are frozen after response.
    // To ensure reliability, we execute the pipeline synchronously inside the request
    // and return the saved visitId directly.
    const savedVisit = await runVisitPipeline({
      householdId,
      workerId,
      rawTranscript: actualTranscript,
      inputMode: inputMode || 'typed',
      sessionId
    });

    res.status(201).json({
      sessionId,
      visitId: savedVisit._id || savedVisit.id,
      visit: savedVisit
    });
  } catch (error) {
    res.status(500).json({ message: `Pipeline initiation failed: ${error.message}` });
  }
}

export async function pipelineStream(req, res) {
  const { sessionId } = req.params;

  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
    'X-Accel-Buffering': 'no'
  });

  res.write('comment: connected\n\n');

  const listener = (data) => {
    res.write(`data: ${JSON.stringify(data)}\n\n`);
    
    // Close the connection once the trace logger finishes
    if (data.stage === 'TRACE_LOGGER' && (data.status === 'complete' || data.status === 'fallback')) {
      pipelineEvents.off(sessionId, listener);
      res.end();
    }
  };

  pipelineEvents.on(sessionId, listener);

  req.on('close', () => {
    pipelineEvents.off(sessionId, listener);
    res.end();
  });

  // Start processing the pipeline asynchronously
  const requestParams = sessionRequests.get(sessionId);
  if (requestParams) {
    sessionRequests.delete(sessionId);

    (async () => {
      try {
        const savedVisit = await runVisitPipeline({
          householdId: requestParams.householdId,
          workerId: requestParams.workerId,
          rawTranscript: requestParams.rawTranscript,
          inputMode: requestParams.inputMode,
          sessionId
        });

        // Emit final result event with the saved visit id
        pipelineEvents.emit(sessionId, {
          stage: 'FINAL_RESULT',
          status: 'complete',
          summary: 'Visit successfully created.',
          visitId: savedVisit._id || savedVisit.id,
          timestamp: new Date().toISOString()
        });
      } catch (err) {
        console.error('❌ Pipeline run error in stream:', err);
        pipelineEvents.emit(sessionId, {
          stage: 'TRACE_LOGGER',
          status: 'fallback',
          summary: `Pipeline failed: ${err.message}`,
          timestamp: new Date().toISOString()
        });
      }
    })();
  }
}

// Custom sort helper to order visits by risk priority
function getRiskScore(level) {
  switch (String(level).toLowerCase()) {
    case 'critical': return 4;
    case 'high': return 3;
    case 'medium': return 2;
    case 'low': return 1;
    default: return 0;
  }
}

export async function getVisits(req, res) {
  try {
    let { workerId } = req.query;
    let visits = [];

    // Enforce role-based scoping
    if (req.user.role === 'worker') {
      workerId = req.user._id || req.user.id;
      visits = await repository.getAll('Visit', { workerId });
    } else if (req.user.role === 'supervisor') {
      const supervisorId = req.user._id || req.user.id;
      // Get all workers supervised by this supervisor
      const supervisedWorkers = await repository.getAll('User', { supervisorId });
      const supervisedWorkerIds = supervisedWorkers.map(w => String(w._id || w.id));

      if (workerId && workerId !== 'sharma') {
        if (!supervisedWorkerIds.includes(String(workerId))) {
          return res.status(403).json({ message: 'Access Denied. You do not supervise this worker.' });
        }
        visits = await repository.getAll('Visit', { workerId });
      } else {
        // Fetch visits for ALL workers supervised by this supervisor
        visits = await repository.getAll('Visit', { workerId: { $in: supervisedWorkerIds } });
      }
    } else {
      if (workerId) {
        visits = await repository.getAll('Visit', { workerId });
      } else {
        visits = await repository.getAll('Visit');
      }
    }
    
    // Sort by risk priority (critical -> high -> medium -> low)
    const sortedVisits = visits.sort((a, b) => {
      const scoreA = getRiskScore(a.riskLevel);
      const scoreB = getRiskScore(b.riskLevel);
      if (scoreA !== scoreB) {
        return scoreB - scoreA; // Descending
      }
      return new Date(b.timestamp) - new Date(a.timestamp); // Tie-breaker: Newest first
    });

    res.status(200).json(sortedVisits);
  } catch (error) {
    res.status(500).json({ message: `Failed to retrieve visits: ${error.message}` });
  }
}

export async function getVisitById(req, res) {
  try {
    const { id } = req.params;
    const visit = await repository.getById('Visit', id);

    if (!visit) {
      return res.status(404).json({ message: 'Visit record not found.' });
    }

    // Scoping check
    if (req.user.role === 'worker' && String(visit.workerId) !== String(req.user._id || req.user.id)) {
      return res.status(403).json({ message: 'Access Denied. You do not own this visit record.' });
    }

    // Fully hydrate householdId and workerId nested objects so patient metadata displays on page refresh
    const household = await repository.getById('Household', visit.householdId);
    const worker = await repository.getById('User', visit.workerId);

    const hydratedVisit = {
      ...visit,
      householdId: household ? {
        _id: household._id || household.id,
        id: household._id || household.id,
        name: household.name,
        village: household.village,
        category: household.category
      } : visit.householdId,
      workerId: worker ? {
        _id: worker._id || worker.id,
        id: worker._id || worker.id,
        name: worker.name,
        email: worker.email
      } : visit.workerId
    };

    res.status(200).json(hydratedVisit);
  } catch (error) {
    res.status(500).json({ message: `Failed to retrieve visit: ${error.message}` });
  }
}

export async function updateVisit(req, res) {
  try {
    const { id } = req.params;
    const visit = await repository.getById('Visit', id);

    if (!visit) {
      return res.status(404).json({ message: 'Visit not found.' });
    }

    // Scoping check
    if (req.user.role === 'worker' && String(visit.workerId) !== String(req.user._id || req.user.id)) {
      return res.status(403).json({ message: 'Access Denied. You cannot modify this visit.' });
    }

    const updated = await repository.updateById('Visit', id, req.body);
    res.status(200).json(updated);
  } catch (error) {
    res.status(500).json({ message: `Failed to update visit: ${error.message}` });
  }
}

export async function getReportByVisitId(req, res) {
  try {
    const { id } = req.params;
    const visit = await repository.getById('Visit', id);

    if (!visit) {
      return res.status(404).json({ message: 'Visit not found.' });
    }

    // Scoping check
    if (req.user.role === 'worker' && String(visit.workerId) !== String(req.user._id || req.user.id)) {
      return res.status(403).json({ message: 'Access Denied. Unauthorized access to report.' });
    }

    if (!visit.report) {
      return res.status(404).json({ message: 'No formal report has been compiled for this visit.' });
    }

    res.status(200).json(visit.report);
  } catch (error) {
    res.status(500).json({ message: `Failed to retrieve report: ${error.message}` });
  }
}

export async function getSimilarPastVisits(req, res) {
  try {
    const { id } = req.params;
    const visit = await repository.getById('Visit', id);

    if (!visit) {
      return res.status(404).json({ message: 'Visit not found.' });
    }

    // Fetch past visits for the same household
    const pastVisits = await repository.getAll('Visit', {
      householdId: visit.householdId
    });

    // Exclude current visit, take top 3 newest
    const filtered = pastVisits
      .filter(v => String(v._id || v.id) !== String(id))
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
      .slice(0, 3);

    res.status(200).json(filtered);
  } catch (error) {
    res.status(500).json({ message: `Failed to retrieve trend history: ${error.message}` });
  }
}
