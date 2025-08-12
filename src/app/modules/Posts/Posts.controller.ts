import httpStatus from "http-status";
import { PostServices } from "./Posts.service";
import { Request, Response } from "express";
import catchAsync from "../../helpers/catchAsync";
import sendResponse from "../../helpers/sendResponse";

// Extend Express Request interface to include 'files'

const createPost = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user.id;
  const payload = req.body;
  const files = req.files;
  const result = await PostServices.createPost(userId, { ...payload, host: req.header('host'), protocol: req.protocol }, files);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    message: "Product post created successfully",
    data: result,
  });
});

const getAllMyPosts = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user.id
  const result = await PostServices.getAllMyPosts(userId);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    message: "Product posts Retrieve successfully",
    data: result,
  });
});



const getAPostDetail = catchAsync(async (req: Request, res: Response) => {
  const postId = req.params.postId;
  const userId = req.user?.id;
  const role = req.user.role;
  const result = await PostServices.getAPostDetail(postId, userId, role);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    message: "Post detail retrieve successfully",
    data: result,
  });
});

const getAllPostsForMySelling = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user?.id;
  const result = await PostServices.getAllPostsForMySelling(userId,);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    message: "Posts retrieve successfully",
    data: result,
  });
});

const createOffer = catchAsync(async (req: Request, res: Response) => {
  const postId = req.params.postId;
  const userId = req.user?.id;

  const result = await PostServices.createOffer(postId, userId, req.body);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    message: "Offer created successfully successfully",
    data: result,
  });
});

const getOffers = catchAsync(async (req: Request, res: Response) => {
  const postId = req.params.postId;
  const userId = req.user?.id;
  const role = req.user.role;
  const result = await PostServices.getOffers(postId, userId, role);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    message: "Post offers retrieve successfully",
    data: result,
  });
});
const getWhoOffers = catchAsync(async (req: Request, res: Response) => {
  const postId = req.params.postId;
  const userId = req.user?.id;
  const role = req.user.role;
  const result = await PostServices.getWhoOffers(postId, userId, role);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    message: "Post offers retrieve successfully",
    data: result,
  });
});


const closePost = catchAsync(async (req: Request, res: Response) => {
  const postId = req.params.postId;
  const userId = req.user?.id;

  const result = await PostServices.closePost(userId, postId);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    message: "Post has been closed",
    data: result,
  });
});



export const PostControllers = {
  createPost,
  getAllMyPosts,
  getAPostDetail,
  getAllPostsForMySelling,
  createOffer,
  getOffers,
  getWhoOffers
  , closePost



};
