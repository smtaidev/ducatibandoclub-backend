import { z } from 'zod';

const createStrategyValidation = z.object({
  body: z.object({
    investmentFocus: z.array(z.string())
      .min(1, 'At least one Investment Focus is required')
      .max(3, 'Maximum 3 Investment Focus options allowed')
      .refine(
        (items) => {
          const validOptions = [
            'Technology & Innovation',
            'Sustainability & Green',
            'Consumer & Lifestyle',
            'Finance & Money',
            'Industrials & Infrastructure',
            'Healthcare & Bio',
            'Behavioral / Macro Themes'
          ];
          return items.every(item => validOptions.includes(item));
        },
        { message: 'Invalid Investment Focus option' }
      ),
    riskTolerance: z.array(z.enum(['Conservative', 'Balanced', 'Aggressive']))
      .min(1, 'At least one Risk Tolerance is required')
      .max(3, 'Maximum 3 Risk Tolerance options allowed'),
    preferredTimeframe: z.array(z.enum(['Intraday', 'Swing', 'Long-Term']))
      .min(1, 'At least one Preferred Timeframe is required')
      .max(3, 'Maximum 3 Preferred Timeframe options allowed'),
  }),
});

export const StrategyValidations = {
  createStrategy: createStrategyValidation,
};
