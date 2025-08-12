
import httpStatus from "http-status";
import ApiError from "../../errors/ApiError";

import prisma from "../../lib/prisma";

const getNotificationsFromDB = async (
  userId: string,

) => {

  const notifications = await prisma.notification.findMany({
    where: {
      receiverId: userId,
    },
    select: {
      id: true,
      title: true,
      body: true,
      senderId: true,
      createdAt: true,
      goTo: true,
      type: true,
      isRead: true,
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  return notifications
};

const getSingleNotificationFromDB = async (
  userId: string,
  notificationId: string
) => {
  const notification = await prisma.notification.findFirst({
    where: {
      id: notificationId,
      receiverId: userId,
    },
  });
  if (!notification) throw new ApiError(httpStatus.NOT_FOUND, "notification not found")

  const updatedNotification = await prisma.notification.update({
    where: { id: notificationId, },
    data: { isRead: true },
    select: {
      id: true,
      title: true,
      body: true,
      senderId: true,
      createdAt: true,
      goTo: true,
      type: true,
      isRead: true,

    },
  });

  return updatedNotification;
};

export const notificationServices = {

  getNotificationsFromDB,
  getSingleNotificationFromDB,
};
