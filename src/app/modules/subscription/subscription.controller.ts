import { Request, Response } from 'express';
import httpStatus from 'http-status';
import catchAsync from '../../helpers/catchAsync';
import sendResponse from '../../helpers/sendResponse';
import { SubscriptionService } from './subscription.service';

const createCheckoutSession = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user?.id;
  console.log('User ID:', userId);
  console.log('Creating subscription for user:', req.user)
  const result = await SubscriptionService.createCheckoutSession(userId, req.body);

  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    success: true,
    message: 'Checkout session created successfully',
    data: result,
  });
});

const createSubscription = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user?.id;
  const result = await SubscriptionService.createSubscription(userId, req.body);

  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    success: true,
    message: 'Subscription created successfully',
    data: result,
  });
});

const getSubscription = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user?.id;
  const result = await SubscriptionService.getSubscription(userId);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Subscription retrieved successfully',
    data: result,
  });
});

const updateSubscription = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user?.id;
  const result = await SubscriptionService.updateSubscription(userId, req.body);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Subscription updated successfully',
    data: result,
  });
});

const cancelSubscription = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user?.id;
  await SubscriptionService.cancelSubscription(userId);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Subscription cancelled successfully',
    data: null,
  });
});

const scheduleSubscriptionCancellation = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user?.id;
  const result = await SubscriptionService.updateSubscription(userId, {
    cancelAtPeriodEnd: true,
  });

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Subscription scheduled for cancellation at the end of current period',
    data: result,
  });
});

const resumeSubscription = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user?.id;
  const result = await SubscriptionService.updateSubscription(userId, {
    cancelAtPeriodEnd: false,
  });

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Subscription cancellation removed successfully',
    data: result,
  });
});

const handleWebhook = catchAsync(async (req: Request, res: Response) => {
  const payload = req.body;
  const signature = req.headers['stripe-signature'] as string;

  await SubscriptionService.handleWebhook(payload, signature);

  res.status(httpStatus.OK).json({ received: true });
});

export const SubscriptionController = {
  createCheckoutSession,
  createSubscription,
  getSubscription,
  updateSubscription,
  cancelSubscription,
  scheduleSubscriptionCancellation,
  resumeSubscription,
  handleWebhook,
};
