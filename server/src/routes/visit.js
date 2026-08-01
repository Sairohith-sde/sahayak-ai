import express from 'express';
import { 
  createVisit, 
  getVisits, 
  getVisitById, 
  updateVisit, 
  getReportByVisitId, 
  getSimilarPastVisits,
  pipelineStream
} from '../controllers/visit.js';
import { authMiddleware } from '../middleware/auth.js';

const router = express.Router();

router.get('/pipeline-stream/:sessionId', pipelineStream);

router.use(authMiddleware);

router.post('/', createVisit);
router.get('/', getVisits);
router.get('/:id', getVisitById);
router.patch('/:id', updateVisit);
router.get('/:id/report', getReportByVisitId);
router.get('/:id/similar', getSimilarPastVisits);

export default router;
