import httpStatus from "http-status";
import ApiError from "../../errors/ApiError";
import prisma from "../../lib/prisma";
import { Role } from "@prisma/client";


const createReview = async (userId: string, sellerId: string, payload: any) => {
  // Check if the service exists

  const seller = await prisma.user.findUnique({
    where: {
      id: sellerId,
      role: Role.SELLER,
      isDeleted: false
    },
    include: {
      reviewsForSeller: true
    }
  });
  if (!seller) throw new ApiError(httpStatus.NOT_FOUND, "seller not found")

  const existingReview = await prisma.review.findUnique({
    where: {
      sellerId_buyerId: {
        sellerId,
        buyerId: userId
      }
    }
  })
  if (!!existingReview) throw new ApiError(httpStatus.CONFLICT, "you have already give review for this seller")

  const result = await prisma.review.create({
    data: {
      sellerId,
      buyerId: userId,
      rating: payload.rating,
      feedBack: payload.feedBack
    }
  })
  if (result) {
    await prisma.user.update({
      where: {
        id: sellerId
      },
      data: {
        totalRating: seller.totalRating + payload.rating,
        totalRaters: seller.totalRaters + 1
      }
    })
  }

  return result;
};




export const ReviewServices = {
  createReview,

  // getMyReviews,
};