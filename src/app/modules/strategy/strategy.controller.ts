import httpStatus from 'http-status';
import { Request, Response } from 'express';
import catchAsync from '../../helpers/catchAsync';
import sendResponse from '../../helpers/sendResponse';
import { StrategyServices } from './strategy.service';
// import logger from '../../config/logger'; // Assuming you have a logger setup (e.g., winston)

const createStrategy = catchAsync(async (req: Request, res: Response) => {
//   logger.info('Received request body:', req.body); // Log the incoming body
  const userId = req.user.id;
  const strategyData = req.body;

  console.log('Creating strategy for user:', userId, 'with data:', strategyData); // Debug log

  const result = await StrategyServices.createStrategy(userId, strategyData);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    message: 'Strategy saved successfully',
    data: result,
  });
});

const getUserStrategy = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user.id;
  
  const result = await StrategyServices.getUserStrategy(userId);
  
  sendResponse(res, {
    statusCode: httpStatus.OK,
    message: 'User strategy retrieved successfully',
    data: result,
  });
});

const getAIStockSuggestions = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user.id;
  
  const result = await StrategyServices.getAIStockSuggestions(userId);
  
  sendResponse(res, {
    statusCode: httpStatus.OK,
    message: 'AI stock suggestions generated successfully',
    data: result,
  });
});

export const StrategyControllers = {
  createStrategy,
  getUserStrategy,
  getAIStockSuggestions,
};
