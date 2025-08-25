import httpStatus from 'http-status';
import { Request, Response } from 'express';
import catchAsync from '../../helpers/catchAsync';
import sendResponse from '../../helpers/sendResponse';
import { StrategyServices } from './strategy.service';
import { getValidOptions } from './strategy.constants';
// import logger from '../../config/logger'; // Assuming you have a logger setup (e.g., winston)

const createStrategy = catchAsync(async (req: Request, res: Response) => {
//   logger.info('Received request body:', req.body); // Log the incoming body
  const userId = req.user?.id;
  if (!userId) {
    return sendResponse(res, {
      statusCode: httpStatus.UNAUTHORIZED,
      message: 'User not authenticated',
      data: null,
    });
  }
  const strategyData = req.body;

//   console.log('Creating strategy for user:', userId, 'with data:', strategyData); // Debug log

  const result = await StrategyServices.createStrategy(userId, strategyData);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    message: 'Strategy saved successfully',
    data: result,
  });
});

const getUserStrategy = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user?.id;
  if (!userId) {
    return sendResponse(res, {
      statusCode: httpStatus.UNAUTHORIZED,
      message: 'User not authenticated',
      data: null,
    });
  }
  
  const result = await StrategyServices.getUserStrategy(userId);
  
  sendResponse(res, {
    statusCode: httpStatus.OK,
    message: 'User strategy retrieved successfully',
    data: result,
  });
});

const getAIStockSuggestions = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user?.id;
  if (!userId) {
    return sendResponse(res, {
      statusCode: httpStatus.UNAUTHORIZED,
      message: 'User not authenticated',
      data: null,
    });
  }
  
  const result = await StrategyServices.getAIStockSuggestions(userId);
  
  sendResponse(res, {
    statusCode: httpStatus.OK,
    message: 'AI stock suggestions generated successfully',
    data: result,
  });
});

const getStrategyOptions = catchAsync(async (req: Request, res: Response) => {
  const validOptions = getValidOptions();
  
  sendResponse(res, {
    statusCode: httpStatus.OK,
    message: 'Strategy options retrieved successfully',
    data: validOptions,
  });
});

export const StrategyControllers = {
  createStrategy,
  getUserStrategy,
  getAIStockSuggestions,
  getStrategyOptions,
};
