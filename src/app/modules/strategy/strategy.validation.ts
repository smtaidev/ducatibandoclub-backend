import { z } from 'zod';

const createStrategyValidation = z.object({
  body: z.object({
    investmentFocus: z.array(z.string()).min(1, 'At least one Investment Focus is required'),
    riskTolerance: z.enum(['Conservative', 'Balanced', 'Aggressive'], {
      required_error: 'Risk Tolerance is required',
    }),
    preferredTimeframe: z.enum(['Intraday', 'Swing', 'Long-Term'], {
      required_error: 'Preferred Timeframe is required',
    }),
  }),
});

export const StrategyValidations = {
  createStrategy: createStrategyValidation,
};