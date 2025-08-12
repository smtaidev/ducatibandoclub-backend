import express from "express";
import auth from "../../middlewares/auth";
import { ReviewControllers } from "./review.controller";
import { Role } from "@prisma/client";
const router = express.Router();

router.post(
  "/:sellerId/create",
  auth(Role.BUYER),
  ReviewControllers.createReview
);
// router.get("/my-reviews", auth(), ReviewControllers.getMyReviews);

// router.get("/all/:serviceId", auth(), ReviewControllers.deleteReview);

export const ReviewRouters = router;
