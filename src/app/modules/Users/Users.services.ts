import httpStatus from 'http-status';
import fs from "fs";
import prisma from '../../lib/prisma';
import path from 'path';

import { Role, User } from '@prisma/client';
import { IPaginationOptions } from '../../interface/pagination.type';
import { paginationHelper } from '../../helpers/paginationHelper';
import ApiError from '../../errors/ApiError';



const getMyProfile = async (userId: string) => {
  // console.log(user);
  const user = await prisma.user.findUnique({
    where: {
      id: userId
    },
    select: {
      id: true,
      name: true,
      image: true,
      role: true,

      storeAddress: {
        select: {
          id: true,
          address: true,
        }
      }
    }
  });
  if (!user) throw new ApiError(httpStatus.NOT_FOUND, 'user not found')
  if (user.role === Role.BUYER) {
    return {
      id: user.id,
      name: user.name,
      image: user.image,
      location: null

    }
  } else if (user.role === Role.SELLER) {
    const store = await prisma.storeAddress.findFirst({
      where: {
        userId: user.id

      },
      select: {
        id: true,
        address: true,
      }
    })
    // if (!store) throw new ApiError(httpStatus.NOT_FOUND, "please update your store")
    return {
      id: user.id,
      name: user.name,
      image: user.image,
      location: store?.address
    }
  }
};

const getSellerProfileById = async (userId: string) => {
  const user = await prisma.user.findUnique({
    where: {
      id: userId,
      role: Role.SELLER,
      isDeleted: false
    },
    select: {
      id: true,
      name: true,
      image: true,

    }
  });

  if (!user) {
    throw new ApiError(httpStatus.NOT_FOUND, 'No user found');
  }
  return user;
};

const getAllUsers = async (options: IPaginationOptions) => {
  const { page, limit, skip } = paginationHelper.calculatePagination(options);
  //  const { search } = options;

  const users = await prisma.user.findMany({
    where: {
      NOT: {
        role: Role.SUPERADMIN
      }
    },
    skip,
    take: limit,
    select: {
      id: true,
      email: true,
      name: true,
      phoneNumber: true,
      role: true,
      status: true,
      createdAt: true,
      updatedAt: true,
    },
    orderBy: {
      createdAt: 'desc',
    },
  });
  const total = await prisma.user.count({
    where: {
      NOT: {
        role: Role.SUPERADMIN
      }
    },
  });
  const totalPages = Math.ceil(total / limit); // Calculate total pages


  return {
    meta: {
      total,
      page,
      totalPage: Math.ceil(total / limit),
      limit,
    },
    data: users,
  };
};



const updateMyProfile = async (userId: string, payload: any) => {
  const existingUser = prisma.user.findUnique({
    where: { id: userId }
  })
  if (!existingUser) {
    throw new ApiError(httpStatus.NOT_FOUND, "User not found");
  }

  await prisma.user.update({
    where: { id: userId },
    data: {
      name: payload.name,

    },
    select: {
      id: true,
      name: true,
      image: true,
      role: true,
      storeAddress: {
        select: {
          id: true,
          address: true,
        }
      }
    }
  })

  return {
    message: "success",

  };
}


const updateMyProfileImage = async (userId: string, payload: any, file: any) => {
// Fetch the existing user with their current image
  const existingUser = await prisma.user.findUnique({
    where: { id: userId },
    select: { image: true }
  });

  // If the user doesn't exist, throw a 404 error
  if (!existingUser) {
    throw new ApiError(httpStatus.NOT_FOUND, "User not found");
  }
  // Generate the new image URL if a file is provided
  const imageURL = file && file.originalname
    ? `${payload.protocol}://${payload.host}/uploads/${file.filename}`
    : existingUser.image; // Keep existing image if no new file is uploaded

  // Update the user's profile with the new image URL
  const updatedUser = await prisma.user.update({
    where: {
      id: userId
    },
    data: {
      image: imageURL
    },
    select: {
      id: true,
      name: true,
      image: true,
    }
  });

  // If the user had an existing image, delete it from the file system
  if (existingUser.image) {
    // Extract the file name from the URL
    const imageFileName = existingUser.image.split('/').pop();

    // Resolve the file path
    const existingImagePath = path.resolve('uploads', imageFileName || '');

    // Check if the file exists before trying to delete it
    fs.exists(existingImagePath, (exists) => {
      if (exists) {
        // Delete the existing image if it exists
        fs.unlink(existingImagePath, (err) => {
          if (err) {
            console.error("Error deleting existing image:", err);
          } else {
            console.log("Existing image deleted successfully");
          }
        });
      } else {
        console.error(`File not found: ${existingImagePath}`);
      }
    });
  }

  // Return the updated user data
  return updatedUser;
};


const updateUserStatus = async (userId: string, payload: { status: any }) => {
  const existingUser = await prisma.user.findUnique({
    where: { id: userId },
    select: { image: true }
  });
  if (!existingUser) {
    throw new ApiError(httpStatus.NOT_FOUND, "User not found");
  }



  const updatedUser = await prisma.user.update({
    where: {
      id: userId
    },
    data: {
      status: payload.status.toUpperCase()

    },
    select: {
      id: true,
      email: true,
      name: true,
      phoneNumber: true,
      role: true,
      status: true,
      createdAt: true,
      updatedAt: true,
    }
  })


  return updatedUser
}

export const UsersService = {

  getMyProfile, getAllUsers,
  updateMyProfile, updateMyProfileImage, updateUserStatus, getSellerProfileById

};
