import { repository } from '../utils/repository.js';

export async function getWorkerDashboardStats(req, res) {
  try {
    let { workerId } = req.query;

    // Enforce worker scoping
    if (req.user.role === 'worker') {
      workerId = req.user._id || req.user.id;
    }

    if (!workerId) {
      return res.status(400).json({ message: 'workerId parameter is required.' });
    }

    // 1. Total Households count
    const totalHouseholds = await repository.count('Household', { workerId });

    // 2. Counts of risk levels across all visits owned by this worker
    const visits = await repository.getAll('Visit', { workerId });

    // Filter to get only the LATEST visit for each unique household (representing their active current status)
    const householdStatusMap = {};
    visits.forEach(v => {
      const hId = String(v.householdId);
      if (!householdStatusMap[hId] || new Date(v.timestamp) > new Date(householdStatusMap[hId].timestamp)) {
        householdStatusMap[hId] = v;
      }
    });

    const activeVisits = Object.values(householdStatusMap);
    const criticalCount = activeVisits.filter(v => v.riskLevel === 'critical').length;
    const highCount = activeVisits.filter(v => v.riskLevel === 'high').length;
    const mediumCount = activeVisits.filter(v => v.riskLevel === 'medium').length;
    const lowCount = activeVisits.filter(v => v.riskLevel === 'low').length;

    // 3. Visits this week (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const visitsThisWeek = visits.filter(v => new Date(v.timestamp) >= sevenDaysAgo).length;

    res.status(200).json({
      totalHouseholds,
      criticalCount,
      highCount,
      mediumCount,
      lowCount,
      visitsThisWeek
    });
  } catch (error) {
    res.status(500).json({ message: `Failed to compile worker dashboard stats: ${error.message}` });
  }
}

export async function getSupervisorDashboardStats(req, res) {
  try {
    let { supervisorId } = req.query;

    if (req.user.role === 'supervisor') {
      supervisorId = req.user._id || req.user.id;
    }

    if (!supervisorId) {
      return res.status(400).json({ message: 'supervisorId parameter is required.' });
    }

    const unresolvedCount = await repository.count('Escalation', { supervisorId, resolved: false });
    const resolvedCount = await repository.count('Escalation', { supervisorId, resolved: true });
    const totalWorkers = await repository.count('User', { supervisorId, role: 'worker' });

    res.status(200).json({
      unresolvedCount,
      resolvedCount,
      totalWorkers
    });
  } catch (error) {
    res.status(500).json({ message: `Failed to compile supervisor dashboard stats: ${error.message}` });
  }
}
