import httpStatus from "http-status";

import { Request, Response } from "express";
import { ReviewServices } from "./review.service";
import catchAsync from "../../helpers/catchAsync";
import sendResponse from "../../helpers/sendResponse";

const createReview = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user.id;
  const payload = req.body;
  const sellerId = req.params.sellerId;
  const result = await ReviewServices.createReview(userId, sellerId, payload,);

  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    message: "Review created successfully",
    data: result,
  });
});




export const ReviewControllers = {
  createReview,

  // getMyReviews,
};
