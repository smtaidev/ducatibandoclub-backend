import { Request, Response } from "express";
import catchAsync from "../../helpers/catchAsync";
import sendResponse from "../../helpers/sendResponse";
import { notificationServices } from "./notification.service";
/*
const sendNotification = catchAsync(async (req: Request, res: Response) => {
  const notification = await notificationServices.sendSingleNotification(req);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "notification sent successfully",
    data: notification,
  });
});


const sendNotifications = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user.id;
  const notifications = await notificationServices.sendNotifications(
    userId,
    req
  );

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "notifications sent successfully",
    data: notifications,
  });
});
*/
const getNotifications = catchAsync(async (req: Request, res: Response) => {

  const notifications = await notificationServices.getNotificationsFromDB(
    req.user.id
  );

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Notifications retrieved successfully",
    data: notifications,
  });
});

const getSingleNotificationById = catchAsync(
  async (req: Request, res: Response) => {
    const notificationId = req.params.notificationId;
    const userId = req.user.id
    const notification = await notificationServices.getSingleNotificationFromDB(
      userId,
      notificationId
    );

    sendResponse(res, {
      success: true,
      statusCode: 200,
      message: "Notification retrieved successfully",
      data: notification,
    });
  }
);

export const notificationController = {
  getNotifications,
  getSingleNotificationById,
};
