import { z } from 'zod';

const createStrategyValidation = z.object({
  body: z.object({
    investmentFocus: z.string({
      required_error: 'Investment Focus is required',
      invalid_type_error: 'Investment Focus must be a string value'
    }).min(1, 'Investment Focus cannot be empty'),
    
    riskTolerance: z.string({
      required_error: 'Risk Tolerance is required',
      invalid_type_error: 'Risk Tolerance must be a string value'
    }).min(1, 'Risk Tolerance cannot be empty'),
    
    preferredTimeframe: z.string({
      required_error: 'Preferred Timeframe is required',
      invalid_type_error: 'Preferred Timeframe must be a string value'
    }).min(1, 'Preferred Timeframe cannot be empty'),
  }),
});

export const StrategyValidations = {
  createStrategy: createStrategyValidation,
};
