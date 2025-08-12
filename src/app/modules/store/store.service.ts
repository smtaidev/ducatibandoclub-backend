import httpStatus from "http-status";

import ApiError from "../../errors/ApiError";
import prisma from "../../lib/prisma";
import slugify from "../../utils/slugify";

import { Role, StoreCategory } from "@prisma/client";


const createStore = async (userId: string, payload: {
  businessName: string;
  storeCategory: StoreCategory;
  address: string;
  latitude: number;
  longitude: number;
}) => {
  const user = await prisma.user.findUnique({
    where: { id: userId }
  })
  if (!user || user.role !== Role.SELLER) {
    throw new ApiError(httpStatus.UNAUTHORIZED, "you are not authorized to create a store")
  }
  let slug = slugify(payload.businessName)
  let slugExists = await prisma.storeAddress.findUnique({
    where: {
      slug
    }
  })
  while (slugExists) {
    slug = `slug-${Math.floor(Math.random() * 1000)}`;
    slugExists = await prisma.storeAddress.findUnique({
      where: {
        slug
      }
    })
  }
  const storeAddress = await prisma.storeAddress.create({
    data: {
      businessName: payload.businessName,
      slug,
      userId,
      storeCategory: payload.storeCategory,
      address: payload.address,
      latitude: payload.latitude,
      longitude: payload.longitude,

    },
  });
  if (!storeAddress) {
    throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, "please try again ")
  }
  return storeAddress;
};




export const StoreServices = {
  createStore


};
