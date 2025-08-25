// import { Request, Response } from 'express';
// import httpStatus from 'http-status';

// import { UsersService } from './Users.services';
// import catchAsync from '../../helpers/catchAsync';
// import sendResponse from '../../helpers/sendResponse';
// import pickValidFields from '../../shared/pickValidFields';
// import { User } from '@prisma/client';


// const getMyProfile = catchAsync(async (req: Request, res: Response) => {

//   const data = await UsersService.getMyProfile(req.user.id as string); // Fetch work area by ID
//   sendResponse(res, {
//     statusCode: httpStatus.OK,
//     success: true,
//     message: 'Fetched profile successfully!',
//     data: data,
//   });
// });
// const getUserProfileById = catchAsync(async (req: Request, res: Response) => {
//   const userId = req.params.id; // Get user ID from the request object

//   const data = await UsersService.getMyProfile(userId); // Fetch work area by ID
//   sendResponse(res, {
//     statusCode: httpStatus.OK,
//     success: true,
//     message: 'Fetched profile successfully!',
//     data: data,
//   });
// });
// const getSellerProfileById = catchAsync(async (req: Request, res: Response) => {
//   const sellerId = req.params.sellerId

//   const data = await UsersService.getSellerProfileById(sellerId); // Fetch work area by ID
//   sendResponse(res, {
//     statusCode: httpStatus.OK,
//     success: true,
//     message: 'Fetched profile successfully!',
//     data: data,
//   });
// });
// const getAllUsers = catchAsync(async (req: Request, res: Response) => {
//   const options = pickValidFields(req.query, ['limit', 'page', "status"]);

//   const data = await UsersService.getAllUsers(options); // Fetch work area by ID
//   sendResponse(res, {
//     statusCode: httpStatus.OK,
//     success: true,
//     message: 'Fetched users successfully!',
//     data: data,
//   });
// });

// const updateMyProfile = catchAsync(async (req: Request, res: Response) => {
//   const userId = req.user.id;
//   const payload = req.body;
//   const data = await UsersService.updateMyProfile(
//     userId, payload
//   );
//   sendResponse(res, {
//     statusCode: httpStatus.OK,
//     success: true,
//     message: 'Profile updated successfully!',
//     data: data,
//   });
// });
// const updateMyProfileImage = catchAsync(async (req: Request, res: Response) => {
//   const userId = req.user.id;
//   const file = req.file;
//   const data = await UsersService.updateMyProfileImage(
//     userId, { host: req.header('host'), protocol: req.protocol }, file
//   );
//   sendResponse(res, {
//     statusCode: httpStatus.OK,
//     success: true,
//     message: 'Profile updated successfully!',
//     data: data,
//   });
// });



// const updateUserStatus = catchAsync(async (req: Request, res: Response) => {
//   const userId = req.user.id;
//   // const location = req.body.location;
//   const result = await UsersService.updateUserStatus(userId, req.body);

//   sendResponse(res, {
//     statusCode: httpStatus.OK,
//     message: 'User profile updated successfully',
//     data: result,
//   });
// });

// export const UsersController = {
//   getMyProfile, getUserProfileById,
//   getSellerProfileById,
//   getAllUsers, updateUserStatus,
//   updateMyProfile, updateMyProfileImage
// };
