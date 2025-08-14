import express from 'express';
import validateRequest from '../../middlewares/validateRequest';
import { StrategyControllers } from './strategy.controller';
import auth from '../../middlewares/auth';
import { StrategyValidations } from './strategy.validation';

const router = express.Router();

router.post(
  '/',
  auth(),
  validateRequest(StrategyValidations.createStrategy),
  StrategyControllers.createStrategy
);

// Get user's current strategy
router.get(
  '/',
  auth(),
  StrategyControllers.getUserStrategy
);

// Get AI-powered stock suggestions based on user's strategy
router.get(
  '/ai-suggestions',
  auth(),
  StrategyControllers.getAIStockSuggestions
);

export const StrategyRoutes = router;
