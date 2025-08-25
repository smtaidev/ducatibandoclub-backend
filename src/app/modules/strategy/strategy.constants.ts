// Strategy validation constants - centralized for easy updates
// Add or modify options here to update the entire system

export const VALID_INVESTMENT_FOCUS = [
  'Technology & Innovation',
  'Sustainability & Green',
  'Consumer & Lifestyle',
  'Finance & Money',
  'Industrials & Infrastructure',
  'Healthcare & Bio',
  'Behavioral / Macro Themes'
] as const;

export const VALID_RISK_TOLERANCE = [
  'Conservative', 
  'Balanced', 
  'Aggressive'
] as const;

export const VALID_TIMEFRAME = [
  'Intraday', 
  'Swing', 
  'Long-Term'
] as const;

// Type definitions for TypeScript
export type InvestmentFocus = typeof VALID_INVESTMENT_FOCUS[number];
export type RiskTolerance = typeof VALID_RISK_TOLERANCE[number];
export type PreferredTimeframe = typeof VALID_TIMEFRAME[number];

// Strategy payload interface
export interface StrategyPayload {
  investmentFocus: InvestmentFocus;
  riskTolerance: RiskTolerance;
  preferredTimeframe: PreferredTimeframe;
}

// Helper function to get all valid options for API documentation
export const getValidOptions = () => ({
  investmentFocus: VALID_INVESTMENT_FOCUS,
  riskTolerance: VALID_RISK_TOLERANCE,
  preferredTimeframe: VALID_TIMEFRAME
});

// Helper function to validate if a value exists in an array
export const isValidOption = <T extends readonly string[]>(
  value: string, 
  validOptions: T
): value is T[number] => {
  return validOptions.includes(value as T[number]);
};
