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

export const StrategyRoutes = router;