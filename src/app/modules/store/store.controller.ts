import httpStatus from "http-status";

import { StoreServices } from "./store.service";
import { Request, Response } from "express";
import { Role } from "@prisma/client";
import catchAsync from "../../helpers/catchAsync";
import sendResponse from "../../helpers/sendResponse";

const createStore = catchAsync(async (req: Request, res: Response) => {
  const payload = req.body;
  const userId = req.user.id
  const result = await StoreServices.createStore(userId, payload);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    message: "Store created successfully",
    data: result,
  });
});

export const StoreControllers = {
  createStore,
};
