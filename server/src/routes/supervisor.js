import express from 'express';
import { getSupervisorEscalations, resolveEscalation } from '../controllers/supervisor.js';
import { authMiddleware, roleMiddleware } from '../middleware/auth.js';

const router = express.Router();

router.use(authMiddleware);

// Map paths clearly as specified in the API contract
router.get('/escalations', roleMiddleware(['supervisor']), getSupervisorEscalations);
router.patch('/escalations/:id', roleMiddleware(['supervisor']), resolveEscalation);

export default router;
