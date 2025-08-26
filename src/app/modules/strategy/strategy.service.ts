import ApiError from '../../errors/ApiError';
import prisma from '../../lib/prisma';

const createStrategy = async (userId: string, payload: {
  investmentFocus: string;
  riskTolerance: string;
  preferredTimeframe: string;
}) => {
  const { investmentFocus, riskTolerance, preferredTimeframe } = payload;

  // Basic validation - just ensure values are not empty
  if (!investmentFocus?.trim()) {
    throw new ApiError(400, 'Investment Focus cannot be empty');
  }

  if (!riskTolerance?.trim()) {
    throw new ApiError(400, 'Risk Tolerance cannot be empty');
  }

  if (!preferredTimeframe?.trim()) {
    throw new ApiError(400, 'Preferred Timeframe cannot be empty');
  }

  // Check if user exists outside transaction for better performance
  const user = await prisma.user.findUnique({
    where: { id: userId },
  });
  if (!user) {
    throw new ApiError(404, 'User not found');
  }

  // Pre-create or find related records outside transaction
  const [investmentFocusRecord, riskToleranceRecord, preferredTimeframeRecord] = await Promise.all([
    prisma.investmentFocus.upsert({
      where: { name: investmentFocus },
      update: {},
      create: { name: investmentFocus },
    }),
    prisma.riskTolerance.upsert({
      where: { name: riskTolerance },
      update: {},
      create: { name: riskTolerance },
    }),
    prisma.preferredTimeframe.upsert({
      where: { name: preferredTimeframe },
      update: {},
      create: { name: preferredTimeframe },
    }),
  ]);

  // Start optimized transaction
  const result = await prisma.$transaction(async (transactionClient) => {
    // Find existing UserStrategy or create new one
    let userStrategy = await transactionClient.userStrategy.findFirst({
      where: { userId },
    });

    if (userStrategy) {
      // Use deleteMany with single query for better performance
      await transactionClient.userStrategyInvestmentFocus.deleteMany({
        where: { userStrategyId: userStrategy.id },
      });
      await transactionClient.userStrategyRiskTolerance.deleteMany({
        where: { userStrategyId: userStrategy.id },
      });
      await transactionClient.userStrategyTimeframe.deleteMany({
        where: { userStrategyId: userStrategy.id },
      });
    } else {
      // Create new strategy
      userStrategy = await transactionClient.userStrategy.create({
        data: { userId },
      });
    }

    // Create relationships in a single Promise.all
    await Promise.all([
      transactionClient.userStrategyInvestmentFocus.create({
        data: {
          userStrategyId: userStrategy.id,
          investmentFocusId: investmentFocusRecord.id,
        },
      }),
      transactionClient.userStrategyRiskTolerance.create({
        data: {
          userStrategyId: userStrategy.id,
          riskToleranceId: riskToleranceRecord.id,
        },
      }),
      transactionClient.userStrategyTimeframe.create({
        data: {
          userStrategyId: userStrategy.id,
          preferredTimeframeId: preferredTimeframeRecord.id,
        },
      }),
    ]);

    return {
      id: userStrategy.id,
      userId: userStrategy.userId,
      riskTolerance,
      preferredTimeframe,
      investmentFocus,
    };
  }, {
    timeout: 8000, // 8 seconds timeout for this specific transaction
  });

  return result;
};

const getUserStrategy = async (userId: string) => {
  const userStrategy = await prisma.userStrategy.findFirst({
    where: { userId },
    include: {
      investmentFocusLinks: {
        include: {
          investmentFocus: true,
        },
      },
      riskToleranceLinks: {
        include: {
          riskTolerance: true,
        },
      },
      timeframeLinks: {
        include: {
          preferredTimeframe: true,
        },
      },
    },
  });

  if (!userStrategy) {
    throw new ApiError(404, 'User strategy not found. Please complete your investment profile first.');
  }

  // Since we're enforcing single selection, take the first (and only) item from each link
  const investmentFocus = userStrategy.investmentFocusLinks[0]?.investmentFocus.name;
  const riskTolerance = userStrategy.riskToleranceLinks[0]?.riskTolerance.name;
  const preferredTimeframe = userStrategy.timeframeLinks[0]?.preferredTimeframe.name;

  if (!investmentFocus || !riskTolerance || !preferredTimeframe) {
    throw new ApiError(400, 'Incomplete strategy data. Please complete your investment profile.');
  }

  return {
    id: userStrategy.id,
    userId: userStrategy.userId,
    investmentFocus,
    riskTolerance,
    preferredTimeframe,
    createdAt: userStrategy.createdAt,
    updatedAt: userStrategy.updatedAt,
  };
};

const getAIStockSuggestions = async (userId: string) => {
  // Get user's strategy first
  const strategy = await getUserStrategy(userId);

  // AI logic for stock suggestions based on strategy
  const suggestions = generateStockSuggestions(strategy);

  return {
    userStrategy: strategy,
    suggestions,
    generatedAt: new Date(),
  };
};

// AI logic to generate stock suggestions based on user strategy
const generateStockSuggestions = (strategy: any) => {
  const { riskTolerance, preferredTimeframe, investmentFocus } = strategy;
  
  // Stock database with categories
  const stockDatabase = {
    'Technology & Innovation': [
      { symbol: 'AAPL', name: 'Apple Inc.', sector: 'Technology', marketCap: 'Large', volatility: 'Medium' },
      { symbol: 'MSFT', name: 'Microsoft Corp.', sector: 'Technology', marketCap: 'Large', volatility: 'Medium' },
      { symbol: 'GOOGL', name: 'Alphabet Inc.', sector: 'Technology', marketCap: 'Large', volatility: 'Medium' },
      { symbol: 'NVDA', name: 'NVIDIA Corp.', sector: 'Technology', marketCap: 'Large', volatility: 'High' },
      { symbol: 'TSLA', name: 'Tesla Inc.', sector: 'Technology/Auto', marketCap: 'Large', volatility: 'High' },
    ],
    'Sustainability & Green': [
      { symbol: 'NEE', name: 'NextEra Energy', sector: 'Utilities', marketCap: 'Large', volatility: 'Low' },
      { symbol: 'ENPH', name: 'Enphase Energy', sector: 'Clean Energy', marketCap: 'Medium', volatility: 'High' },
      { symbol: 'PLUG', name: 'Plug Power', sector: 'Clean Energy', marketCap: 'Small', volatility: 'High' },
      { symbol: 'BEP', name: 'Brookfield Renewable', sector: 'Renewables', marketCap: 'Medium', volatility: 'Medium' },
    ],
    'Consumer & Lifestyle': [
      { symbol: 'AMZN', name: 'Amazon.com Inc.', sector: 'Consumer Discretionary', marketCap: 'Large', volatility: 'Medium' },
      { symbol: 'NKE', name: 'Nike Inc.', sector: 'Consumer Discretionary', marketCap: 'Large', volatility: 'Medium' },
      { symbol: 'SBUX', name: 'Starbucks Corp.', sector: 'Consumer Discretionary', marketCap: 'Large', volatility: 'Medium' },
      { symbol: 'HD', name: 'Home Depot', sector: 'Consumer Discretionary', marketCap: 'Large', volatility: 'Low' },
    ],
    'Finance & Money': [
      { symbol: 'JPM', name: 'JPMorgan Chase', sector: 'Financial Services', marketCap: 'Large', volatility: 'Medium' },
      { symbol: 'BAC', name: 'Bank of America', sector: 'Financial Services', marketCap: 'Large', volatility: 'Medium' },
      { symbol: 'V', name: 'Visa Inc.', sector: 'Financial Services', marketCap: 'Large', volatility: 'Low' },
      { symbol: 'MA', name: 'Mastercard Inc.', sector: 'Financial Services', marketCap: 'Large', volatility: 'Low' },
    ],
    'Industrials & Infrastructure': [
      { symbol: 'CAT', name: 'Caterpillar Inc.', sector: 'Industrials', marketCap: 'Large', volatility: 'Medium' },
      { symbol: 'BA', name: 'Boeing Co.', sector: 'Industrials', marketCap: 'Large', volatility: 'High' },
      { symbol: 'GE', name: 'General Electric', sector: 'Industrials', marketCap: 'Large', volatility: 'High' },
      { symbol: 'UNP', name: 'Union Pacific', sector: 'Transportation', marketCap: 'Large', volatility: 'Medium' },
    ],
    'Healthcare & Bio': [
      { symbol: 'JNJ', name: 'Johnson & Johnson', sector: 'Healthcare', marketCap: 'Large', volatility: 'Low' },
      { symbol: 'PFE', name: 'Pfizer Inc.', sector: 'Healthcare', marketCap: 'Large', volatility: 'Medium' },
      { symbol: 'UNH', name: 'UnitedHealth Group', sector: 'Healthcare', marketCap: 'Large', volatility: 'Low' },
      { symbol: 'MRNA', name: 'Moderna Inc.', sector: 'Biotechnology', marketCap: 'Medium', volatility: 'High' },
    ],
    'Behavioral / Macro Themes': [
      { symbol: 'SPY', name: 'SPDR S&P 500 ETF', sector: 'ETF', marketCap: 'Large', volatility: 'Medium' },
      { symbol: 'QQQ', name: 'Invesco QQQ Trust', sector: 'ETF', marketCap: 'Large', volatility: 'Medium' },
      { symbol: 'VTI', name: 'Vanguard Total Stock Market', sector: 'ETF', marketCap: 'Large', volatility: 'Medium' },
      { symbol: 'GLD', name: 'SPDR Gold Trust', sector: 'Commodities', marketCap: 'Large', volatility: 'Medium' },
    ],
  };

  // Default stocks for unknown investment focus
  const defaultStocks = [
    { symbol: 'SPY', name: 'SPDR S&P 500 ETF', sector: 'ETF', marketCap: 'Large', volatility: 'Medium' },
    { symbol: 'VTI', name: 'Vanguard Total Stock Market', sector: 'ETF', marketCap: 'Large', volatility: 'Medium' },
    { symbol: 'QQQ', name: 'Invesco QQQ Trust', sector: 'ETF', marketCap: 'Large', volatility: 'Medium' },
  ];

  // Get stocks based on investment focus (use default if not found)
  let candidateStocks: any[] = stockDatabase[investmentFocus as keyof typeof stockDatabase] || defaultStocks;

  // Filter based on risk tolerance (flexible matching)
  let filteredStocks = candidateStocks;
  const riskLower = riskTolerance.toLowerCase();
  if (riskLower.includes('conservative') || riskLower.includes('low')) {
    filteredStocks = candidateStocks.filter(stock => stock.volatility === 'Low' || stock.volatility === 'Medium');
  } else if (riskLower.includes('aggressive') || riskLower.includes('high')) {
    filteredStocks = candidateStocks.filter(stock => stock.volatility === 'Medium' || stock.volatility === 'High');
  } else {
    filteredStocks = candidateStocks; // Default to all for balanced/unknown
  }

  // Add timeframe-specific recommendations (flexible matching)
  const timeframeLower = preferredTimeframe.toLowerCase();
  let timeframeAdvice;
  
  if (timeframeLower.includes('intraday') || timeframeLower.includes('day') || timeframeLower.includes('short')) {
    timeframeAdvice = {
      recommendation: 'Focus on high-volume, liquid stocks with technical patterns',
      advice: 'Consider stocks with daily trading volume > 10M shares and clear support/resistance levels',
    };
  } else if (timeframeLower.includes('swing') || timeframeLower.includes('medium')) {
    timeframeAdvice = {
      recommendation: 'Look for stocks with momentum and upcoming catalysts',
      advice: 'Target stocks with earnings announcements, product launches, or sector rotation opportunities',
    };
  } else if (timeframeLower.includes('long') || timeframeLower.includes('term')) {
    timeframeAdvice = {
      recommendation: 'Focus on fundamentally strong companies with competitive advantages',
      advice: 'Prioritize companies with strong balance sheets, consistent growth, and market leadership',
    };
  } else {
    timeframeAdvice = {
      recommendation: `Custom timeframe: ${preferredTimeframe}`,
      advice: 'Consider your specific investment horizon and adjust position sizes accordingly',
    };
  }

  // Remove duplicates and limit to top 10
  const uniqueStocks = Array.from(new Map(filteredStocks.map(stock => [stock.symbol, stock])).values())
    .slice(0, 10);

  return {
    recommendedStocks: uniqueStocks,
    strategy: {
      riskLevel: riskTolerance,
      timeframe: preferredTimeframe,
      focusArea: investmentFocus,
    },
    timeframeAdvice,
    riskWarning: getRiskWarning(riskTolerance),
    diversificationTip: getDiversificationTip(investmentFocus),
  };
};

const getRiskWarning = (riskTolerance: string) => {
  const warnings = {
    'Conservative': 'Remember that even conservative investments carry some risk. Consider diversifying across asset classes.',
    'Balanced': 'Balance is key - ensure your portfolio includes both growth and stable investments.',
    'Aggressive': 'High-risk investments can offer high returns but also significant losses. Only invest what you can afford to lose.',
  };
  return warnings[riskTolerance as keyof typeof warnings] || 'Always do your own research before investing.';
};

const getDiversificationTip = (investmentFocus: string) => {
  // Since we have single selection, always recommend diversification
  return `You've selected ${investmentFocus} as your focus area. Consider diversifying into additional sectors to reduce concentration risk and balance your portfolio.`;
};

export const StrategyServices = {
  createStrategy,
  getUserStrategy,
  getAIStockSuggestions,
};
