import httpStatus from "http-status";
import ApiError from "../../errors/ApiError";

import prisma from "../../lib/prisma";
import { getDistance } from "geolib";


import { Role, StoreCategory } from "@prisma/client";
import { firebasePushNotificationServices } from "../../lib/pushNotificationServices";

const createPost = async (userId: string, payload: any, files: any) => {
  const existingUser = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!existingUser) {
    throw new ApiError(httpStatus.BAD_REQUEST, "User not found");
  }

  // Fetch sellers and their store details
  const sellers = await prisma.user.findMany({
    where: {
      role: Role.SELLER,
      // notificationsEnabled: true, // Assuming there's a field for notification subscription
    },
    include: {
      storeAddress: true, // assuming the storeAddress includes latitude and longitude
    },
  });
  // Filter sellers by subscription to notifications and store category
  const relevantSellers = sellers.filter((seller) => {
    // Check if seller is subscribed and if any of their store addresses' category matches the product's category
    return Array.isArray(seller.storeAddress) && seller.storeAddress.some(
      (address) => address.storeCategory === (payload.category as StoreCategory)
    );
  });
  // Function to calculate distance between two geo coordinates (Haversine formula)
  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371; // Radius of the Earth in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c; // Distance in kilometers
  };
  // Filter sellers within the specified distance
  const filteredSellers = relevantSellers.filter((seller) => {
    // Find the first store address that matches the category
    const address = Array.isArray(seller.storeAddress)
      ? seller.storeAddress.find((addr) => addr.storeCategory === (payload.category as StoreCategory))
      : null;
    if (!address) return false;
    const distance = calculateDistance(
      address.latitude,
      address.longitude,
      payload.latitude,
      payload.longitude
    );
    return distance <= payload.distance; // Assuming payload.distance is in km
  });
  // Create the product post
  const imageURL = files
    ? files.map((file: any) =>
      file.originalname
        ? `${payload.protocol}://${payload.host}/uploads/${file.filename}`
        : ""
    )
    : [];
  const product = await prisma.product.create({
    data: {
      name: payload.productName,
      brandName: payload.brandName,
      category: payload.category as StoreCategory,
      description: payload.description,
      images: imageURL,
      distance: payload.distance,
      address: payload.address,
      latitude: payload.latitude,
      longitude: payload.longitude,
      buyerId: userId,
      isDeleted: false,
    },
  });


  // Create and send notifications to filtered sellers
  if (filteredSellers.length > 0) {
    const notifications = filteredSellers.map((seller) => ({
      receiverId: seller.id,
      senderId: userId,
      message: `New product posted in your category: ${payload.productName} brand ${payload.brandName}`,
      body: `New product posted in your category: ${payload.productName} brand ${payload.brandName}`,
      title: `New product posted in your category: ${payload.productName}`,
      goTo: "posts",
      type: "posts",
      createdAt: new Date(),
      isRead: false,
    }));

    await prisma.notification.createMany(
      {
        data: notifications
      }
    );
    const poshNotifications = {
      title: "New Product Alert",
      body: `A new product matching your category: ${payload.productName} is posted.`,
    }

    const fcmTokens = filteredSellers
      .map((seller: any) => seller.fcmToken)
      .filter((token: string | null): token is string => token !== null);
    if (fcmTokens.length > 0) {
      firebasePushNotificationServices.sendPushNotification(
        {
          body: poshNotifications,
          fcmTokens: fcmTokens
        })
    }
  }
  return product;
};

const getAllMyPosts = async (userId: string) => {
  // Fetch services from the database
  return await prisma.product.findMany({
    where: {
      buyerId: userId
    },
    orderBy: {
      createdAt: "desc",
    },
    select: {
      id: true,
      brandName: true,
      name: true,
      address: true,
      category: true,
      images: true,
    },
  });
};

const getAPostDetail = async (postId: string, userId: string, userRole: string) => {
  // Fetch the post details from the database
  const post = await prisma.product.findUnique({
    where: {
      id: postId,
      isDeleted: false,
      isPostClosed: false,
    },
    select: {
      id: true,
      brandName: true,
      name: true,
      address: true,
      category: true,
      images: true,
      description: true,
      buyer: {
        select: {
          id: true,
          name: true,
        }
      },  // Store the creator's userId for comparison
      _count: {
        select: {
          offers: true
        }
      }
    },
  });

  // Check if the post exists
  if (!post) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Post not found or is closed.');
  }

  // Check if the user is a buyer
  if (userRole === 'BUYER') {
    // A buyer can only view the post if they created it
    if (post.buyer.id !== userId) {
      throw new ApiError(httpStatus.FORBIDDEN, 'You can only view posts that you created.');
    }
  }
  let isComment = false
  // Check if the user is a seller
  if (userRole === 'SELLER') {
    // Fetch the seller's store and check if the store has the same category as the post
    const store = await prisma.storeAddress.findFirst({
      where: {
        userId: userId,
        storeCategory: post.category

      },
      select: {
        id: true,
        storeCategory: true,  // Assuming the store has a category field
      },
    });
    const offer = await prisma.offer.findUnique({
      where: {
        productId_sellerId: {
          productId: postId,
          sellerId: userId
        }
      }
    });
    isComment = !!offer;

    // If no store or category mismatch, restrict access
    if (!store || store.storeCategory !== post.category) {
      throw new ApiError(httpStatus.FORBIDDEN, 'You can only view posts in your store\'s category.');
    }
  }


  const { _count, ...data } = post;
  return {
    ...data,
    numberOfOffers: _count.offers,
    isComment
  };
};
const getAllPostsForMySelling = async (userId: string) => {
  const seller = await prisma.user.findUnique({
    where: {
      id: userId
    },
    include: {
      storeAddress: true
    }
  })
  if (!seller) throw new ApiError(httpStatus.NOT_FOUND, "user not found")


  const categories = seller?.storeAddress.map((store: any) => store.storeCategory)
  // Fetch the post details from the database
  const posts = await prisma.product.findMany({
    where: {
      category: {
        in: categories
      },
    },
    orderBy: {
      createdAt: "desc"

    },
    select: {
      id: true,
      brandName: true,
      name: true,
      address: true,
      category: true,
      images: true,

      buyerId: true,  // Store the creator's userId for comparison

    },
  });
  return posts
};

const createOffer = async (postId: string, userId: string, payload: { offerDetail: string; isSameBrand: boolean }) => {
  // Fetch the post details from the database
  const post = await prisma.product.findUnique({
    where: {
      id: postId,
      isDeleted: false,
      isPostClosed: false,
    },
    select: {
      id: true,
      brandName: true,
      name: true,
      address: true,
      category: true,
      images: true,
      description: true,
      buyer: {
        select: {
          id: true,
          name: true,
        }
      },  // Store the creator's userId for comparison
      _count: {
        select: {
          offers: true
        }
      }
    },
  });

  // Check if the post exists
  if (!post) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Post not found or is closed.');
  }

  let isComment = false
  // Check if the user is a seller

  // Fetch the seller's store and check if the store has the same category as the post
  const store = await prisma.storeAddress.findFirst({
    where: {
      userId: userId,
      storeCategory: post.category

    },
    select: {
      id: true,
      storeCategory: true,  // Assuming the store has a category field
    },
  });
  if (!store || store.storeCategory !== post.category) {
    throw new ApiError(httpStatus.FORBIDDEN, 'You can only view posts in your store\'s category.');
  }

  const offer = await prisma.offer.findUnique({
    where: {
      productId_sellerId: {
        productId: postId,
        sellerId: userId
      }
    }
  });
  // If no store or category mismatch, restrict access
  if (!!offer) throw new ApiError(httpStatus.CONFLICT, "you have already offer for this post")

  await prisma.offer.create({
    data: {
      productId: postId,
      offerDetail: payload.offerDetail,
      isSameBrand: payload.isSameBrand,
      sellerId: userId,


    }
  })

  return {
    message: "offer created successfully"

  };
};
const getOffers = async (postId: string, userId: string, userRole: string) => {
  // Fetch the post details from the database
  const post = await prisma.product.findUnique({
    where: {
      id: postId,
      isDeleted: false,
      isPostClosed: false,
    },
    select: {
      id: true,
      brandName: true,
      latitude: true,
      longitude: true,
      category: true,
      buyer: {
        select: {
          id: true,
          name: true,
          image: true,
        }
      },
      offers: {
        select: {
          id: true,
          offerDetail: true,
          isSameBrand: true,
          sellerId: true,
          seller: {
            select: {
              id: true,
              name: true,
              image: true,
              storeAddress: {
                select: {
                  id: true,
                  businessName: true,
                  slug: true,
                  latitude: true,
                  longitude: true,
                }
              },
            }
          },
        }
      }
    },
  });

  // Check if the post exists
  if (!post) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Post not found or is closed.');
  }

  // Check if the user is a buyer
  if (userRole === 'BUYER') {

    // A buyer can only view the post if they created it
    if (post.buyer.id !== userId) {
      throw new ApiError(httpStatus.FORBIDDEN, 'You can only view posts that you created.');
    }


    if (post.offers.length > 0) {
      const offers = post.offers.map((offer: any) => {
        // calculate the distance

        const distanceMeters = getDistance(
          {
            latitude: post.latitude,
            longitude: post.longitude,
          },
          {
            latitude: offer.seller.storeAddress[0].latitude,
            longitude: offer.seller.storeAddress[0].longitude,
          }

        );
        const distanceKm = Number((distanceMeters / 1000).toFixed(3));
        return {

          distanceKm,
          brandName: post.brandName,
          sellerName: offer.seller.name,
          sellerId: offer.seller.id,
          sellerImage: offer.seller.image,
          isSameBrand: offer.isSameBrand,
          offerDetail: offer.offerDetail,
          sellerAvgRating: 3.5,

        }
      })
      post.offers = offers as any
    }
    return post.offers
  } else if (userRole === 'SELLER') {

    const store = await prisma.storeAddress.findFirst({
      where: {
        userId: userId,
        storeCategory: post.category
      },
      select: {
        id: true,
        storeCategory: true,  // Assuming the store has a category field
        businessName: true,
        slug: true,
        latitude: true,
        longitude: true,
      },
    });
    const offer = await prisma.offer.findUnique({
      where: {
        productId_sellerId: {
          productId: postId,
          sellerId: userId
        }
      }
    });

    // If no store or category mismatch, restrict access
    if (!store || store.storeCategory !== post.category) {
      throw new ApiError(httpStatus.FORBIDDEN, 'You can only view posts in your store\'s category.');
    }
    if (!offer) throw new ApiError(httpStatus.FORBIDDEN, 'to view the offer you have to create offer first');
    const distanceMeters = getDistance(
      {
        latitude: post.latitude,
        longitude: post.longitude,
      },
      {
        latitude: store.latitude,
        longitude: store.longitude,
      }
    );
    const distanceKm = Number((distanceMeters / 1000).toFixed(3));
    return [{
      distanceKm,
      brandName: post.brandName,
      sellerName: post.buyer.name,
      sellerId: post.buyer.id,
      sellerImage: post.buyer.image,
      isSameBrand: offer.isSameBrand,
      offerDetail: offer.offerDetail,
      sellerAvgRating: 3.5,
    }]
  } else {
    return post
  }

};
const getWhoOffers = async (postId: string, userId: string, userRole: string) => {
  // Fetch the post details from the database
  const post = await prisma.product.findUnique({
    where: {
      id: postId,
      isDeleted: false,
      isPostClosed: false,
    },
    select: {
      id: true,
      category: true,
      buyer: {
        select: {
          id: true,
          name: true,
          image: true,
        }
      },
      offers: {
        select: {
          seller: {
            select: {
              id: true,
              name: true,
              image: true,
              storeAddress: {
                select: {
                  id: true,
                  businessName: true,
                  slug: true,
                  address: true,
                }
              },
            }
          },
        }
      }
    },
  });

  // Check if the post exists
  if (!post) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Post not found or is closed.');
  }
  // Check if the user is a buyer
  if (userRole === 'BUYER') {
    // A buyer can only view the post if they created it
    if (post.buyer.id !== userId) {
      throw new ApiError(httpStatus.FORBIDDEN, 'You can only view posts that you created.');
    }
    if (post.offers.length > 0) {
      const offers = post.offers.map((offer: any) => {
        return {
          sellerName: offer.seller.name,
          sellerId: offer.seller.id,
          sellerImage: offer.seller.image,
          shopName: offer.seller.storeAddress[0].businessName,
          address: offer.seller.storeAddress[0].address,
          offerDetail: offer.offerDetail,
        }
      })

      post.offers = offers as any
    }
    return post.offers
  } else {
    return post
  }

};

const closePost = async (userId: string, productId: string) => {
  // Check if the service exists
  console.log({ userId })
  const product = await prisma.product.findUnique({
    where: {
      id: productId,
      buyerId: userId
    },

  });
  if (!product) throw new ApiError(httpStatus.NOT_FOUND, "Post not exists or you are not the owner of the post")
  const updatedProduct = await prisma.product.update({
    where: {
      id: productId
    },
    data: {
      isPostClosed: true
    }
  })
  if (!updatedProduct) throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, "something went wrong")


  return {
    message: "Post has been closed"
  };
};




export const PostServices = {
  createPost,
  getAllMyPosts,
  getAPostDetail,
  getAllPostsForMySelling,
  createOffer,
  getOffers,
  getWhoOffers,
  closePost

};
