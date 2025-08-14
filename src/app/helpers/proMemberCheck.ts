import httpStatus from 'http-status';
import ApiError from '../errors/ApiError';
import prisma from '../lib/prisma';

/**
 * Check if a user is a pro member with an active subscription
 * @param userId - The user ID to check
 * @throws ApiError if user is not found or not a pro member
 */
export const requireProMembership = async (userId: string): Promise<void> => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      isProMember: true,
      membershipEnds: true,
      Subscription: {
        where: {
          status: 'ACTIVE',
        },
        select: {
          id: true,
          status: true,
          currentPeriodEnd: true,
        },
        orderBy: {
          createdAt: 'desc',
        },
        take: 1,
      },
    },
  });

  if (!user) {
    throw new ApiError(httpStatus.NOT_FOUND, 'User not found');
  }

  if (!user.isProMember) {
    throw new ApiError(
      httpStatus.FORBIDDEN,
      'This feature requires a pro subscription. Please upgrade your account.'
    );
  }

  // Double-check with membership end date
  if (user.membershipEnds && user.membershipEnds < new Date()) {
    throw new ApiError(
      httpStatus.FORBIDDEN,
      'Your subscription has expired. Please renew to access pro features.'
    );
  }

  // Optional: Check if there's an active subscription
  if (user.Subscription.length === 0) {
    throw new ApiError(
      httpStatus.FORBIDDEN,
      'No active subscription found. Please subscribe to access pro features.'
    );
  }
};

/**
 * Check if a user is a pro member (returns boolean instead of throwing)
 * @param userId - The user ID to check
 * @returns Promise<boolean> - True if user is a pro member with active subscription
 */
export const isProMember = async (userId: string): Promise<boolean> => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        isProMember: true,
        membershipEnds: true,
      },
    });

    if (!user || !user.isProMember) {
      return false;
    }

    // Check if membership is still valid
    if (user.membershipEnds && user.membershipEnds < new Date()) {
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error checking pro membership:', error);
    return false;
  }
};

/**
 * Get subscription status for a user
 * @param userId - The user ID to check
 * @returns Promise<object | null> - Subscription details or null if no subscription
 */
export const getSubscriptionStatus = async (userId: string) => {
  try {
    const subscription = await prisma.subscription.findFirst({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        status: true,
        currentPeriodStart: true,
        currentPeriodEnd: true,
        cancelAtPeriodEnd: true,
        amount: true,
        currency: true,
        plan: true,
      },
    });

    return subscription;
  } catch (error) {
    console.error('Error getting subscription status:', error);
    return null;
  }
};
