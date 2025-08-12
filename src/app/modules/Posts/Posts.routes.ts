import express from "express";

import { PostControllers } from "./Posts.controller";

import { PostValidation } from "./Posts.validation";
import auth, { optionalAuth } from "../../middlewares/auth";
import { Role } from "@prisma/client";
import parseBodyData from "../../middlewares/parseBodyData";

import validateRequest from "../../middlewares/validateRequest";
import { fileUploader } from "../../middlewares/multerFileUpload";

const router = express.Router();

router.post(
  "/create",
  fileUploader.uploadProductImage,
  parseBodyData,
  validateRequest(PostValidation.createPostSchema),
  auth(),
  PostControllers.createPost
);

router.get("/my-post", auth(Role.BUYER), PostControllers.getAllMyPosts);
router.get("/for-seller", auth(Role.SELLER), PostControllers.getAllPostsForMySelling);
router.get("/detail/:postId/offers", auth(), PostControllers.getOffers);
router.get("/detail/:postId/who-offers", auth(Role.BUYER, Role.ADMIN, Role.SUPERADMIN), PostControllers.getWhoOffers);
router.post("/detail/:postId/create-offer", auth(Role.SELLER), PostControllers.createOffer);

router.get("/detail/:postId", auth(), PostControllers.getAPostDetail);
router.put("/detail/:postId/close", auth(), PostControllers.closePost);

// router.put(
//   "/update-service/:id",
//   fileUploader.uploadServiceImage,
//   parseBodyData,
//   auth(),
//   ServiceControllers.updateService
// );


// router.put("/wish-list/:serviceId", auth(Role.USER), ServiceControllers.addToWishList);
// router.get("/wish-list", auth(Role.USER), ServiceControllers.
// router.get("/:id", optionalAuth(), ServiceControllers.getSingleService);

export const PostRouters = router;
