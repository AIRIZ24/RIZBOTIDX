/**
 * Premium Feature Guard
 * HOC and hook to protect premium features with usage limits
 */

import { getSession, canUseFeature, incrementUsage, SUBSCRIPTION_LIMITS, SubscriptionTier } from './authService';

export type FeatureType = 'analysis' | 'watchlist' | 'alert' | 'portfolio';

export interface UsageCheckResult {
  allowed: boolean;
  isGuest: boolean;
  currentTier: SubscriptionTier | null;
  currentUsage: number;
  maxUsage: number;
  remaining: number | 'unlimited';
}

/**
 * Check if user can use a specific feature
 */
export const checkFeatureUsage = (feature: FeatureType, currentCount?: number): UsageCheckResult => {
  const user = getSession();
  
  // Guest user
  if (!user) {
    return {
      allowed: false,
      isGuest: true,
      currentTier: null,
      currentUsage: 0,
      maxUsage: 0,
      remaining: 0,
    };
  }

  // Admin has unlimited access
  if (user.isAdmin) {
    return {
      allowed: true,
      isGuest: false,
      currentTier: user.subscription,
      currentUsage: 0,
      maxUsage: -1,
      remaining: 'unlimited',
    };
  }

  const limits = SUBSCRIPTION_LIMITS[user.subscription];
  
  let maxUsage: number;
  let currentUsage: number;
  
  switch (feature) {
    case 'analysis':
      maxUsage = limits.dailyAnalysis;
      currentUsage = user.dailyAnalysisCount;
      break;
    case 'watchlist':
      maxUsage = limits.watchlistLimit;
      currentUsage = currentCount ?? 0;
      break;
    case 'alert':
      maxUsage = limits.alertLimit;
      currentUsage = currentCount ?? 0;
      break;
    case 'portfolio':
      maxUsage = limits.portfolioLimit;
      currentUsage = currentCount ?? 0;
      break;
  }

  // Unlimited (-1)
  if (maxUsage === -1) {
    return {
      allowed: true,
      isGuest: false,
      currentTier: user.subscription,
      currentUsage,
      maxUsage: -1,
      remaining: 'unlimited',
    };
  }

  const allowed = currentUsage < maxUsage;
  const remaining = Math.max(0, maxUsage - currentUsage);

  return {
    allowed,
    isGuest: false,
    currentTier: user.subscription,
    currentUsage,
    maxUsage,
    remaining,
  };
};

/**
 * Use a feature and increment usage counter
 * Returns updated usage result
 */
export const useFeature = (feature: FeatureType): UsageCheckResult => {
  const check = checkFeatureUsage(feature);
  
  if (!check.allowed) {
    return check;
  }

  // Increment usage for analysis (daily counter)
  if (feature === 'analysis') {
    const updatedUser = incrementUsage('analysis');
    if (updatedUser) {
      return {
        ...check,
        currentUsage: updatedUser.dailyAnalysisCount,
        remaining: check.maxUsage === -1 ? 'unlimited' : Math.max(0, check.maxUsage - updatedUser.dailyAnalysisCount),
      };
    }
  }

  return check;
};

/**
 * Check if a premium feature is available for current tier
 */
export const isPremiumFeatureAvailable = (feature: string): { available: boolean; requiredTier: SubscriptionTier } => {
  const user = getSession();
  
  // Admin has access to all features
  if (user?.isAdmin) {
    return { available: true, requiredTier: 'elite' };
  }
  
  const premiumFeatures: Record<string, SubscriptionTier[]> = {
    'live_assistant': ['pro', 'elite'],
    'news_sentiment': ['basic', 'pro', 'elite'],
    'portfolio_tracker': ['basic', 'pro', 'elite'],
    'ai_trading': ['basic', 'pro', 'elite'],
    'export_pdf': ['pro', 'elite'],
    'export_excel': ['pro', 'elite'],
    'telegram_alerts': ['elite'],
    'api_access': ['elite'],
    'backtesting': ['elite'],
    'custom_indicators': ['elite'],
    'multi_portfolio': ['pro', 'elite'],
  };

  const allowedTiers = premiumFeatures[feature] || ['free', 'basic', 'pro', 'elite'];
  
  if (!user) {
    return { available: false, requiredTier: allowedTiers[0] };
  }

  const available = allowedTiers.includes(user.subscription);
  const requiredTier = allowedTiers[0];

  return { available, requiredTier };
};

/**
 * Get feature limits for display
 */
export const getFeatureLimits = (tier: SubscriptionTier) => {
  return SUBSCRIPTION_LIMITS[tier];
};

/**
 * Format remaining usage message
 */
export const formatRemainingUsage = (feature: FeatureType): string => {
  const check = checkFeatureUsage(feature);
  
  if (check.isGuest) {
    return 'Login untuk menggunakan fitur ini';
  }
  
  if (check.remaining === 'unlimited') {
    return 'Unlimited';
  }
  
  const featureNames: Record<FeatureType, string> = {
    analysis: 'analisis',
    watchlist: 'saham',
    alert: 'alert',
    portfolio: 'portfolio',
  };
  
  return `${check.remaining} ${featureNames[feature]} tersisa`;
};

/**
 * Check if user is near their limit (80%+ used)
 */
export const isNearLimit = (feature: FeatureType, currentCount?: number): boolean => {
  const check = checkFeatureUsage(feature, currentCount);
  
  if (check.isGuest || check.remaining === 'unlimited') {
    return false;
  }
  
  const usagePercent = (check.currentUsage / check.maxUsage) * 100;
  return usagePercent >= 80;
};

export default {
  checkFeatureUsage,
  useFeature,
  isPremiumFeatureAvailable,
  getFeatureLimits,
  formatRemainingUsage,
  isNearLimit,
};
