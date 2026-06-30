export interface PlanLimits {
  creativesPerMonth: number | 'unlimited';
  videoLengthSeconds: number;
  maxResolution: '720p' | '1080p' | '4k';
  abTesting: boolean;
  priorityQueue: boolean;
  supportLevel: 'community' | 'email' | 'priority' | 'dedicated';
  customWatermark: boolean;
}

export interface BillingPlan {
  id: string;
  name: string;
  priceBrl: number;
  limits: PlanLimits;
}

export const BILLING_PLANS: Record<string, BillingPlan> = {
  STARTER: {
    id: 'STARTER',
    name: 'Starter',
    priceBrl: 0,
    limits: {
      creativesPerMonth: 5,
      videoLengthSeconds: 15,
      maxResolution: '720p',
      abTesting: false,
      priorityQueue: false,
      supportLevel: 'community',
      customWatermark: false
    }
  },
  PRO: {
    id: 'PRO',
    name: 'Pro',
    priceBrl: 97,
    limits: {
      creativesPerMonth: 30,
      videoLengthSeconds: 30,
      maxResolution: '1080p',
      abTesting: true,
      priorityQueue: false,
      supportLevel: 'email',
      customWatermark: true
    }
  },
  BUSINESS: {
    id: 'BUSINESS',
    name: 'Business',
    priceBrl: 297,
    limits: {
      creativesPerMonth: 150,
      videoLengthSeconds: 60,
      maxResolution: '1080p',
      abTesting: true,
      priorityQueue: true,
      supportLevel: 'priority',
      customWatermark: true
    }
  },
  ENTERPRISE: {
    id: 'ENTERPRISE',
    name: 'Enterprise',
    priceBrl: 997,
    limits: {
      creativesPerMonth: 'unlimited',
      videoLengthSeconds: 120,
      maxResolution: '4k',
      abTesting: true,
      priorityQueue: true,
      supportLevel: 'dedicated',
      customWatermark: true
    }
  }
};
