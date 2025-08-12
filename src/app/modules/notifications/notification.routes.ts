import express from 'express';
import { notificationController } from './notification.controller';
import auth from '../../middlewares/auth';
import validateRequest from "../../middlewares/validateRequest";
import { NotificationValidation } from "./notification.validation";

const router = express.Router();
/*
router.post(
  "/send-notification/:userId",
  validateRequest(NotificationValidation.cerateNotification),
  auth(),
  notificationController.sendNotification
);

router.post(
  "/send-notification",
  validateRequest(NotificationValidation.cerateNotification),
  auth(),
  notificationController.sendNotifications
);
*/

router.get(
  '/:notificationId',
  auth(),
  notificationController.getSingleNotificationById,
);

router.get('/', auth(), notificationController.getNotifications);


export const NotificationsRouters = router;
