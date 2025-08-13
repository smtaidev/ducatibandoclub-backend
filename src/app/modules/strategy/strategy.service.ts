import { PrismaClient } from '@prisma/client';
import ApiError from '../../errors/ApiError';

const prisma = new PrismaClient();

const createStrategy = async (userId: string, payload: {
  investmentFocus: string[];
  riskTolerance: string;
  preferredTimeframe: string;
}) => {
  const { investmentFocus, riskTolerance, preferredTimeframe } = payload;

  // Validate investment focus options
  const validInvestmentFocus = [
    'Technology & Innovation',
    'Sustainability & Green',
    'Consumer & Lifestyle',
    'Finance & Money',
    'Industrials & Infrastructure',
    'Healthcare & Bio',
    'Behavioral / Macro Themes',
  ];
  if (!investmentFocus.every(focus => validInvestmentFocus.includes(focus))) {
    throw new ApiError(400, 'Invalid Investment Focus option');
  }

  // Validate risk tolerance
  const validRiskTolerance = ['Conservative', 'Balanced', 'Aggressive'];
  if (!validRiskTolerance.includes(riskTolerance)) {
    throw new ApiError(400, 'Invalid Risk Tolerance option');
  }

  // Validate preferred timeframe
  const validPreferredTimeframe = ['Intraday', 'Swing', 'Long-Term'];
  if (!validPreferredTimeframe.includes(preferredTimeframe)) {
    throw new ApiError(400, 'Invalid Preferred Timeframe option');
  }

  // Start transaction to ensure data consistency
  const result = await prisma.$transaction(async (transactionClient) => {
    // Check if user exists
    const user = await transactionClient.user.findUnique({
      where: { id: userId },
    });
    if (!user) {
      throw new ApiError(404, 'User not found');
    }

    // Find or create RiskTolerance and PreferredTimeframe by name to get their IDs
    const riskToleranceRecord = await transactionClient.riskTolerance.upsert({
      where: { name: riskTolerance },
      update: {},
      create: { name: riskTolerance },
    });

    const preferredTimeframeRecord = await transactionClient.preferredTimeframe.upsert({
      where: { name: preferredTimeframe },
      update: {},
      create: { name: preferredTimeframe },
    });

    // Find existing UserStrategy by userId or create a new one
    const userStrategy = await transactionClient.userStrategy.upsert({
      where: { id: userId }, // Assuming userId is unique (update schema if not)
      update: {
        riskToleranceId: riskToleranceRecord.id,
        preferredTimeframeId: preferredTimeframeRecord.id,
      },
      create: {
        userId,
        riskToleranceId: riskToleranceRecord.id,
        preferredTimeframeId: preferredTimeframeRecord.id,
      },
    });

    // Create or update InvestmentFocus links
    await Promise.all(
      investmentFocus.map(async (focus) => {
        const investmentFocusRecord = await transactionClient.investmentFocus.upsert({
          where: { name: focus },
          update: {},
          create: { name: focus },
        });

        await transactionClient.userStrategyInvestmentFocus.upsert({
          where: {
            userStrategyId_investmentFocusId: {
              userStrategyId: userStrategy.id,
              investmentFocusId: investmentFocusRecord.id,
            },
          },
          update: {},
          create: {
            userStrategyId: userStrategy.id,
            investmentFocusId: investmentFocusRecord.id,
          },
        });
      })
    );

    return {
      id: userStrategy.id,
      userId: userStrategy.userId,
      riskTolerance,
      preferredTimeframe,
      investmentFocus,
    };
  });

  return result;
};

export const StrategyServices = {
  createStrategy,
};