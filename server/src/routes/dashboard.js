import express from 'express';
import { getWorkerDashboardStats, getSupervisorDashboardStats } from '../controllers/dashboard.js';
import { authMiddleware } from '../middleware/auth.js';

const router = express.Router();

router.use(authMiddleware);

router.get('/', getWorkerDashboardStats);
router.get('/supervisor', getSupervisorDashboardStats);

export default router;
