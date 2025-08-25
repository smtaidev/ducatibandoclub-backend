// import ApiError from '../../errors/ApiError';
// import prisma from '../../lib/prisma';

// const createStrategy = async (userId: string, payload: {
//   investmentFocus: string[];
//   riskTolerance: string;
//   preferredTimeframe: string;
// }) => {
//   const { investmentFocus, riskTolerance, preferredTimeframe } = payload;

//   // Validate investment focus options
//   const validInvestmentFocus = [
//     'Technology & Innovation',
//     'Sustainability & Green',
//     'Consumer & Lifestyle',
//     'Finance & Money',
//     'Industrials & Infrastructure',
//     'Healthcare & Bio',
//     'Behavioral / Macro Themes',
//   ];
//   if (!investmentFocus.every(focus => validInvestmentFocus.includes(focus))) {
//     throw new ApiError(400, 'Invalid Investment Focus option');
//   }

//   // Validate risk tolerance
//   const validRiskTolerance = ['Conservative', 'Balanced', 'Aggressive'];
//   if (!validRiskTolerance.includes(riskTolerance)) {
//     throw new ApiError(400, 'Invalid Risk Tolerance option');
//   }

//   // Validate preferred timeframe
//   const validPreferredTimeframe = ['Intraday', 'Swing', 'Long-Term'];
//   if (!validPreferredTimeframe.includes(preferredTimeframe)) {
//     throw new ApiError(400, 'Invalid Preferred Timeframe option');
//   }

//   // Start transaction to ensure data consistency
//   const result = await prisma.$transaction(async (transactionClient) => {
//     // Check if user exists
//     const user = await transactionClient.user.findUnique({
//       where: { id: userId },
//     });
//     if (!user) {
//       throw new ApiError(404, 'User not found');
//     }

//     // Find or create RiskTolerance and PreferredTimeframe by name to get their IDs
//     const riskToleranceRecord = await transactionClient.riskTolerance.upsert({
//       where: { name: riskTolerance },
//       update: {},
//       create: { name: riskTolerance },
//     });

//     const preferredTimeframeRecord = await transactionClient.preferredTimeframe.upsert({
//       where: { name: preferredTimeframe },
//       update: {},
//       create: { name: preferredTimeframe },
//     });

//     // Find existing UserStrategy by userId or create a new one
//     const userStrategy = await transactionClient.userStrategy.upsert({
//       where: { id: userId }, // Assuming userId is unique (update schema if not)
//       update: {
//         riskToleranceId: riskToleranceRecord.id,
//         preferredTimeframeId: preferredTimeframeRecord.id,
//       },
//       create: {
//         userId,
//         riskToleranceId: riskToleranceRecord.id,
//         preferredTimeframeId: preferredTimeframeRecord.id,
//       },
//     });

//     // Create or update InvestmentFocus links
//     await Promise.all(
//       investmentFocus.map(async (focus) => {
//         const investmentFocusRecord = await transactionClient.investmentFocus.upsert({
//           where: { name: focus },
//           update: {},
//           create: { name: focus },
//         });

//         await transactionClient.userStrategyInvestmentFocus.upsert({
//           where: {
//             userStrategyId_investmentFocusId: {
//               userStrategyId: userStrategy.id,
//               investmentFocusId: investmentFocusRecord.id,
//             },
//           },
//           update: {},
//           create: {
//             userStrategyId: userStrategy.id,
//             investmentFocusId: investmentFocusRecord.id,
//           },
//         });
//       })
//     );

//     return {
//       id: userStrategy.id,
//       userId: userStrategy.userId,
//       riskTolerance,
//       preferredTimeframe,
//       investmentFocus,
//     };
//   });

//   return result;
// };

// const getUserStrategy = async (userId: string) => {
//   const userStrategy = await prisma.userStrategy.findFirst({
//     where: { userId },
//     include: {
//       riskTolerance: true,
//       preferredTimeframe: true,
//       investmentFocusLinks: {
//         include: {
//           investmentFocus: true,
//         },
//       },
//     },
//   });

//   if (!userStrategy) {
//     throw new ApiError(404, 'User strategy not found. Please complete your investment profile first.');
//   }

//   return {
//     id: userStrategy.id,
//     userId: userStrategy.userId,
//     riskTolerance: userStrategy.riskTolerance.name,
//     preferredTimeframe: userStrategy.preferredTimeframe.name,
//     investmentFocus: userStrategy.investmentFocusLinks.map(
//       (link) => link.investmentFocus.name
//     ),
//     createdAt: userStrategy.createdAt,
//     updatedAt: userStrategy.updatedAt,
//   };
// };

// const getAIStockSuggestions = async (userId: string) => {
//   // Get user's strategy first
//   const strategy = await getUserStrategy(userId);

//   // AI logic for stock suggestions based on strategy
//   const suggestions = generateStockSuggestions(strategy);

//   return {
//     userStrategy: strategy,
//     suggestions,
//     generatedAt: new Date(),
//   };
// };

// // AI logic to generate stock suggestions based on user strategy
// const generateStockSuggestions = (strategy: any) => {
//   const { riskTolerance, preferredTimeframe, investmentFocus } = strategy;
  
//   // Stock database with categories
//   const stockDatabase = {
//     'Technology & Innovation': [
//       { symbol: 'AAPL', name: 'Apple Inc.', sector: 'Technology', marketCap: 'Large', volatility: 'Medium' },
//       { symbol: 'MSFT', name: 'Microsoft Corp.', sector: 'Technology', marketCap: 'Large', volatility: 'Medium' },
//       { symbol: 'GOOGL', name: 'Alphabet Inc.', sector: 'Technology', marketCap: 'Large', volatility: 'Medium' },
//       { symbol: 'NVDA', name: 'NVIDIA Corp.', sector: 'Technology', marketCap: 'Large', volatility: 'High' },
//       { symbol: 'TSLA', name: 'Tesla Inc.', sector: 'Technology/Auto', marketCap: 'Large', volatility: 'High' },
//     ],
//     'Sustainability & Green': [
//       { symbol: 'NEE', name: 'NextEra Energy', sector: 'Utilities', marketCap: 'Large', volatility: 'Low' },
//       { symbol: 'ENPH', name: 'Enphase Energy', sector: 'Clean Energy', marketCap: 'Medium', volatility: 'High' },
//       { symbol: 'PLUG', name: 'Plug Power', sector: 'Clean Energy', marketCap: 'Small', volatility: 'High' },
//       { symbol: 'BEP', name: 'Brookfield Renewable', sector: 'Renewables', marketCap: 'Medium', volatility: 'Medium' },
//     ],
//     'Consumer & Lifestyle': [
//       { symbol: 'AMZN', name: 'Amazon.com Inc.', sector: 'Consumer Discretionary', marketCap: 'Large', volatility: 'Medium' },
//       { symbol: 'NKE', name: 'Nike Inc.', sector: 'Consumer Discretionary', marketCap: 'Large', volatility: 'Medium' },
//       { symbol: 'SBUX', name: 'Starbucks Corp.', sector: 'Consumer Discretionary', marketCap: 'Large', volatility: 'Medium' },
//       { symbol: 'HD', name: 'Home Depot', sector: 'Consumer Discretionary', marketCap: 'Large', volatility: 'Low' },
//     ],
//     'Finance & Money': [
//       { symbol: 'JPM', name: 'JPMorgan Chase', sector: 'Financial Services', marketCap: 'Large', volatility: 'Medium' },
//       { symbol: 'BAC', name: 'Bank of America', sector: 'Financial Services', marketCap: 'Large', volatility: 'Medium' },
//       { symbol: 'V', name: 'Visa Inc.', sector: 'Financial Services', marketCap: 'Large', volatility: 'Low' },
//       { symbol: 'MA', name: 'Mastercard Inc.', sector: 'Financial Services', marketCap: 'Large', volatility: 'Low' },
//     ],
//     'Industrials & Infrastructure': [
//       { symbol: 'CAT', name: 'Caterpillar Inc.', sector: 'Industrials', marketCap: 'Large', volatility: 'Medium' },
//       { symbol: 'BA', name: 'Boeing Co.', sector: 'Industrials', marketCap: 'Large', volatility: 'High' },
//       { symbol: 'GE', name: 'General Electric', sector: 'Industrials', marketCap: 'Large', volatility: 'High' },
//       { symbol: 'UNP', name: 'Union Pacific', sector: 'Transportation', marketCap: 'Large', volatility: 'Medium' },
//     ],
//     'Healthcare & Bio': [
//       { symbol: 'JNJ', name: 'Johnson & Johnson', sector: 'Healthcare', marketCap: 'Large', volatility: 'Low' },
//       { symbol: 'PFE', name: 'Pfizer Inc.', sector: 'Healthcare', marketCap: 'Large', volatility: 'Medium' },
//       { symbol: 'UNH', name: 'UnitedHealth Group', sector: 'Healthcare', marketCap: 'Large', volatility: 'Low' },
//       { symbol: 'MRNA', name: 'Moderna Inc.', sector: 'Biotechnology', marketCap: 'Medium', volatility: 'High' },
//     ],
//     'Behavioral / Macro Themes': [
//       { symbol: 'SPY', name: 'SPDR S&P 500 ETF', sector: 'ETF', marketCap: 'Large', volatility: 'Medium' },
//       { symbol: 'QQQ', name: 'Invesco QQQ Trust', sector: 'ETF', marketCap: 'Large', volatility: 'Medium' },
//       { symbol: 'VTI', name: 'Vanguard Total Stock Market', sector: 'ETF', marketCap: 'Large', volatility: 'Medium' },
//       { symbol: 'GLD', name: 'SPDR Gold Trust', sector: 'Commodities', marketCap: 'Large', volatility: 'Medium' },
//     ],
//   };

//   // Get stocks based on investment focus
//   let candidateStocks: any[] = [];
//   investmentFocus.forEach((focus: string) => {
//     if (stockDatabase[focus as keyof typeof stockDatabase]) {
//       candidateStocks = candidateStocks.concat(stockDatabase[focus as keyof typeof stockDatabase]);
//     }
//   });

//   // Filter based on risk tolerance
//   let filteredStocks = candidateStocks;
//   if (riskTolerance === 'Conservative') {
//     filteredStocks = candidateStocks.filter(stock => stock.volatility === 'Low' || stock.volatility === 'Medium');
//   } else if (riskTolerance === 'Balanced') {
//     filteredStocks = candidateStocks; // All volatility levels
//   } else if (riskTolerance === 'Aggressive') {
//     filteredStocks = candidateStocks.filter(stock => stock.volatility === 'Medium' || stock.volatility === 'High');
//   }

//   // Add timeframe-specific recommendations
//   const timeframeAdvice = {
//     'Intraday': {
//       recommendation: 'Focus on high-volume, liquid stocks with technical patterns',
//       advice: 'Consider stocks with daily trading volume > 10M shares and clear support/resistance levels',
//     },
//     'Swing': {
//       recommendation: 'Look for stocks with momentum and upcoming catalysts',
//       advice: 'Target stocks with earnings announcements, product launches, or sector rotation opportunities',
//     },
//     'Long-Term': {
//       recommendation: 'Focus on fundamentally strong companies with competitive advantages',
//       advice: 'Prioritize companies with strong balance sheets, consistent growth, and market leadership',
//     },
//   };

//   // Remove duplicates and limit to top 10
//   const uniqueStocks = Array.from(new Map(filteredStocks.map(stock => [stock.symbol, stock])).values())
//     .slice(0, 10);

//   return {
//     recommendedStocks: uniqueStocks,
//     strategy: {
//       riskLevel: riskTolerance,
//       timeframe: preferredTimeframe,
//       focusAreas: investmentFocus,
//     },
//     timeframeAdvice: timeframeAdvice[preferredTimeframe as keyof typeof timeframeAdvice],
//     riskWarning: getRiskWarning(riskTolerance),
//     diversificationTip: getDiversificationTip(investmentFocus),
//   };
// };

// const getRiskWarning = (riskTolerance: string) => {
//   const warnings = {
//     'Conservative': 'Remember that even conservative investments carry some risk. Consider diversifying across asset classes.',
//     'Balanced': 'Balance is key - ensure your portfolio includes both growth and stable investments.',
//     'Aggressive': 'High-risk investments can offer high returns but also significant losses. Only invest what you can afford to lose.',
//   };
//   return warnings[riskTolerance as keyof typeof warnings] || 'Always do your own research before investing.';
// };

// const getDiversificationTip = (investmentFocus: string[]) => {
//   if (investmentFocus.length === 1) {
//     return 'Consider diversifying into additional sectors to reduce concentration risk.';
//   } else if (investmentFocus.length > 4) {
//     return 'You have diverse interests - consider focusing on 3-4 key areas for better portfolio management.';
//   } else {
//     return 'Good diversification across sectors. Make sure to also diversify within each sector.';
//   }
// };

// export const StrategyServices = {
//   createStrategy,
//   getUserStrategy,
//   getAIStockSuggestions,
// };
