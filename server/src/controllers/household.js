import { repository } from '../utils/repository.js';

export async function getHouseholds(req, res) {
  try {
    let { workerId } = req.query;
    
    // Enforce worker scoping: workers can only see their own households
    if (req.user.role === 'worker') {
      workerId = req.user._id || req.user.id;
    }

    if (!workerId) {
      return res.status(400).json({ message: 'workerId parameter is required.' });
    }

    const households = await repository.getAll('Household', { workerId });
    res.status(200).json(households);
  } catch (error) {
    res.status(500).json({ message: `Failed to retrieve households: ${error.message}` });
  }
}

export async function createHousehold(req, res) {
  try {
    const { name, village, category } = req.body;
    const workerId = req.user._id || req.user.id;

    if (!name || !village) {
      return res.status(400).json({ message: 'Missing name or village.' });
    }

    const newHousehold = await repository.create('Household', {
      name,
      village,
      category: category || 'general',
      workerId
    });

    res.status(201).json(newHousehold);
  } catch (error) {
    res.status(500).json({ message: `Failed to create household: ${error.message}` });
  }
}

export async function getHouseholdById(req, res) {
  try {
    const { id } = req.params;
    const household = await repository.getById('Household', id);

    if (!household) {
      return res.status(404).json({ message: 'Household not found.' });
    }

    // Enforce scoping
    if (req.user.role === 'worker' && String(household.workerId) !== String(req.user._id || req.user.id)) {
      return res.status(403).json({ message: 'Access Denied. You do not own this household.' });
    }

    res.status(200).json(household);
  } catch (error) {
    res.status(500).json({ message: `Failed to fetch household: ${error.message}` });
  }
}

export async function updateHousehold(req, res) {
  try {
    const { id } = req.params;
    const household = await repository.getById('Household', id);

    if (!household) {
      return res.status(404).json({ message: 'Household not found.' });
    }

    // Enforce scoping
    if (req.user.role === 'worker' && String(household.workerId) !== String(req.user._id || req.user.id)) {
      return res.status(403).json({ message: 'Access Denied. You cannot modify this household.' });
    }

    const updated = await repository.updateById('Household', id, req.body);
    res.status(200).json(updated);
  } catch (error) {
    res.status(500).json({ message: `Failed to update household: ${error.message}` });
  }
}

export async function deleteHousehold(req, res) {
  try {
    const { id } = req.params;
    const household = await repository.getById('Household', id);

    if (!household) {
      return res.status(404).json({ message: 'Household not found.' });
    }

    // Enforce scoping
    if (req.user.role === 'worker' && String(household.workerId) !== String(req.user._id || req.user.id)) {
      return res.status(403).json({ message: 'Access Denied. You cannot delete this household.' });
    }

    // Cascading delete: delete household, its visits, and its escalations
    await repository.deleteById('Household', id);
    const visits = await repository.getAll('Visit', { householdId: id });
    const visitIds = visits.map(v => v._id || v.id);

    await repository.deleteWhere('Visit', { householdId: id });
    await repository.deleteWhere('Escalation', { visitId: { $in: visitIds } });

    res.status(200).json({ message: 'Household and associated visits/escalations deleted successfully.' });
  } catch (error) {
    res.status(500).json({ message: `Failed to delete household: ${error.message}` });
  }
}
