import { repository } from '../utils/repository.js';

export async function getSupervisorEscalations(req, res) {
  try {
    let { supervisorId } = req.query;

    // Enforce supervisor scoping
    if (req.user.role === 'supervisor') {
      supervisorId = req.user._id || req.user.id;
    }

    if (!supervisorId) {
      return res.status(400).json({ message: 'supervisorId parameter is required.' });
    }

    // Fetch all escalations for this supervisor (both resolved and unresolved)
    const escalations = await repository.getAll('Escalation', {
      supervisorId
    });

    // Deduplicate escalations safely by ID
    const seenIds = new Set();
    const uniqueEscalations = escalations.filter(esc => {
      const idStr = String(esc._id || esc.id);
      if (seenIds.has(idStr)) return false;
      seenIds.add(idStr);
      return true;
    });

    // Hydrate/join details manually so that it works identically in BOTH MongoDB and Memory Modes!
    const hydratedEscalations = [];
    for (const esc of uniqueEscalations) {
      const visit = await repository.getById('Visit', esc.visitId);
      if (!visit) continue;

      const household = await repository.getById('Household', visit.householdId);
      const worker = await repository.getById('User', visit.workerId);

      hydratedEscalations.push({
        ...esc,
        visit: {
          id: visit._id || visit.id,
          rawTranscript: visit.rawTranscript,
          riskLevel: visit.riskLevel,
          riskJustification: visit.riskJustification,
          timestamp: visit.timestamp,
          extractedData: visit.extractedData,
          trace: visit.trace
        },
        household: household ? {
          id: household._id || household.id,
          name: household.name,
          village: household.village,
          category: household.category
        } : null,
        worker: worker ? {
          id: worker._id || worker.id,
          name: worker.name,
          email: worker.email
        } : null
      });
    }

    // Sort newest first
    hydratedEscalations.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    res.status(200).json(hydratedEscalations);
  } catch (error) {
    res.status(500).json({ message: `Failed to retrieve escalations: ${error.message}` });
  }
}

export async function resolveEscalation(req, res) {
  try {
    const { id } = req.params;
    if (!id) {
      return res.status(400).json({ message: 'Escalation ID is required.' });
    }

    const escalation = await repository.getById('Escalation', id);
    if (!escalation) {
      return res.status(404).json({ message: 'Escalation record not found.' });
    }

    // Enforce scoping
    if (req.user.role === 'supervisor' && String(escalation.supervisorId) !== String(req.user._id || req.user.id)) {
      return res.status(403).json({ message: 'Access Denied. You do not supervise this escalation.' });
    }

    // Update escalation to resolved
    const resolvedEscalation = await repository.updateById('Escalation', id, {
      resolved: true,
      resolvedAt: new Date()
    });

    if (!resolvedEscalation) {
      return res.status(500).json({ message: 'Failed to update escalation record.' });
    }

    // Update the associated Visit status back to 'reviewed'
    if (escalation.visitId) {
      try {
        await repository.updateById('Visit', escalation.visitId, {
          status: 'reviewed'
        });
      } catch (visitUpdateErr) {
        console.warn(`⚠️ Warning: Could not update associated visit status: ${visitUpdateErr.message}`);
      }
    }

    res.status(200).json({
      message: 'Escalation successfully resolved and closed.',
      escalation: resolvedEscalation
    });
  } catch (error) {
    res.status(500).json({ message: `Failed to resolve escalation: ${error.message}` });
  }
}
