import express from 'express';
import { 
  getHouseholds, 
  createHousehold, 
  getHouseholdById, 
  updateHousehold, 
  deleteHousehold 
} from '../controllers/household.js';
import { authMiddleware } from '../middleware/auth.js';

const router = express.Router();

router.use(authMiddleware);

router.get('/', getHouseholds);
router.post('/', createHousehold);
router.get('/:id', getHouseholdById);
router.patch('/:id', updateHousehold);
router.delete('/:id', deleteHousehold);

export default router;
