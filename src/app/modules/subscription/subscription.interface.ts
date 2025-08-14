export interface ICreateSubscription {
  userId: string;
  paymentMethodId?: string;
  priceId?: string;
}

export interface ISubscriptionWebhook {
  type: string;
  data: {
    object: any;
  };
}

export interface IUpdateSubscription {
  cancelAtPeriodEnd?: boolean;
  newPriceId?: string;
}

export interface ISubscriptionResponse {
  id: string;
  status: string;
  currentPeriodStart: Date;
  currentPeriodEnd: Date;
  cancelAtPeriodEnd: boolean;
  clientSecret?: string;
}

export interface ICheckoutSession {
  userId: string;
  successUrl: string;
  cancelUrl: string;
  priceId?: string;
}
