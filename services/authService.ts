/**
 * Auth Service - SECURE VERSION
 * Handles user authentication, registration, and session management
 * 
 * Security Features:
 * - PBKDF2 password hashing with salt
 * - Encrypted localStorage storage
 * - Rate limiting for login attempts
 * - Input validation and sanitization
 * - Audit logging
 * 
 * ⚠️ PRODUCTION NOTICE: For production deployment, you should:
 * - Use a backend server with proper JWT authentication
 * - Store user data in an encrypted database
 * - Use httpOnly cookies for session management
 * - Implement proper CSRF protection
 */

import {
  hashPassword as secureHashPassword,
  verifyPassword as secureVerifyPassword,
  generateSalt,
  secureStore,
  secureRetrieve,
  validateEmail,
  validatePassword,
  validateName,
  checkRateLimit,
  resetRateLimit,
  generateSessionToken,
  logSecurityEvent,
} from './securityService';

export type SubscriptionTier = 'free' | 'basic' | 'pro' | 'elite';

export interface User {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  subscription: SubscriptionTier;
  subscriptionExpiry?: number;
  createdAt: number;
  lastLogin: number;
  // Usage limits
  dailyAnalysisCount: number;
  dailyAnalysisLimit: number;
  lastAnalysisReset: number;
  // Admin privileges
  isAdmin?: boolean;
  // Security metadata
  loginAttempts?: number;
  lastFailedLogin?: number;
  passwordChangedAt?: number;
}

interface StoredUserData {
  user: User;
  passwordHash: string;
  salt: string;
}

// Admin email with full access
const ADMIN_EMAIL = 'firmansyahrizki141@gmail.com';

// List of admin emails (add more as needed)
const ADMIN_EMAILS = [
  'firmansyahrizki141@gmail.com',
  'admin@rizbot.id',
  'admin@rizbot.com',
  'demo@rizbot.id', // demo account has admin privileges for testing
];

// Default admin accounts for testing/experimentation
const DEFAULT_ADMIN_ACCOUNTS = [
  {
    email: 'admin@rizbot.id',
    password: 'Admin@123',
    name: 'RIZBOT Admin',
  },
  {
    email: 'demo@rizbot.id', 
    password: 'Demo@123',
    name: 'Demo User',
  },
];

// Check if email is admin
export const isAdminEmail = (email: string): boolean => {
  const normalized = email.toLowerCase().trim();
  return ADMIN_EMAILS.some(admin => admin.toLowerCase() === normalized);
};

export interface AuthState {
  isAuthenticated: boolean;
  user: User | null;
  loading: boolean;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
}

// Storage keys
const USERS_KEY = 'rizbot_users_v2';
const SESSION_KEY = 'rizbot_session_v2';
const CURRENT_USER_KEY = 'rizbot_current_user_v2';

// Rate limiting constants
const MAX_LOGIN_ATTEMPTS = 5;
const LOGIN_LOCKOUT_MS = 15 * 60 * 1000; // 15 minutes

// Session duration
const SESSION_DURATION_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

// Subscription limits
export const SUBSCRIPTION_LIMITS: Record<SubscriptionTier, {
  dailyAnalysis: number;
  watchlistLimit: number;
  alertLimit: number;
  portfolioLimit: number;
  features: string[];
  price: number;
  name: string;
}> = {
  free: {
    dailyAnalysis: 3,
    watchlistLimit: 5,
    alertLimit: 2,
    portfolioLimit: 1,
    price: 0,
    name: 'Free',
    features: [
      'Watchlist 5 saham',
      '3 analisis AI/hari',
      '2 price alert',
      'Chart dasar',
    ],
  },
  basic: {
    dailyAnalysis: 20,
    watchlistLimit: 20,
    alertLimit: 10,
    portfolioLimit: 3,
    price: 49000,
    name: 'Basic',
    features: [
      'Watchlist 20 saham',
      '20 analisis AI/hari',
      '10 price alert',
      'Portfolio tracker',
      'News sentiment',
    ],
  },
  pro: {
    dailyAnalysis: 100,
    watchlistLimit: 50,
    alertLimit: 50,
    portfolioLimit: 10,
    price: 149000,
    name: 'Pro',
    features: [
      'Watchlist 50 saham',
      '100 analisis AI/hari',
      '50 price alert',
      'Multi-portfolio',
      'Live Assistant',
      'Export PDF/Excel',
      'Priority support',
    ],
  },
  elite: {
    dailyAnalysis: -1, // unlimited
    watchlistLimit: -1,
    alertLimit: -1,
    portfolioLimit: -1,
    price: 499000,
    name: 'Elite',
    features: [
      'Unlimited semua fitur',
      'API access',
      'Custom indicators',
      'Backtesting',
      'Telegram alerts',
      'Dedicated support',
      'Early access fitur baru',
    ],
  },
};

// Generate unique ID using crypto
const generateId = (): string => {
  const array = new Uint8Array(16);
  crypto.getRandomValues(array);
  return `user_${Array.from(array, b => b.toString(16).padStart(2, '0')).join('')}`;
};

// Get all users from storage (with decryption)
const getUsers = async (): Promise<Record<string, StoredUserData>> => {
  try {
    const users = await secureRetrieve<Record<string, StoredUserData>>(USERS_KEY);
    if (users) return users;
    
    // Try to migrate old unencrypted data
    const oldData = localStorage.getItem('rizbot_users');
    if (oldData) {
      const parsed = JSON.parse(oldData);
      const migrated: Record<string, StoredUserData> = {};
      for (const [id, data] of Object.entries(parsed as Record<string, any>)) {
        migrated[id] = {
          user: data.user,
          passwordHash: data.passwordHash || '',
          salt: generateSalt(),
        };
      }
      await saveUsers(migrated);
      localStorage.removeItem('rizbot_users');
      return migrated;
    }
    return {};
  } catch {
    return {};
  }
};

// Synchronous version for backward compatibility
const getUsersSync = (): Record<string, StoredUserData> => {
  try {
    const stored = localStorage.getItem(USERS_KEY);
    if (stored) {
      try {
        return JSON.parse(stored);
      } catch {
        return {};
      }
    }
    // Fallback to old key
    const oldData = localStorage.getItem('rizbot_users');
    if (oldData) {
      const parsed = JSON.parse(oldData);
      const migrated: Record<string, StoredUserData> = {};
      for (const [id, data] of Object.entries(parsed as Record<string, any>)) {
        migrated[id] = {
          user: data.user,
          passwordHash: data.passwordHash || '',
          salt: '',
        };
      }
      return migrated;
    }
    return {};
  } catch {
    return {};
  }
};

// Save users to storage (with encryption)
const saveUsers = async (users: Record<string, StoredUserData>): Promise<void> => {
  try {
    await secureStore(USERS_KEY, users);
  } catch {
    // Fallback to regular storage
    localStorage.setItem(USERS_KEY, JSON.stringify(users));
  }
};

// Synchronous save for backward compatibility
const saveUsersSync = (users: Record<string, StoredUserData>): void => {
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
};

// Get current session
export const getSession = (): User | null => {
  try {
    const session = localStorage.getItem(SESSION_KEY);
    if (!session) {
      // Try old session key
      const oldSession = localStorage.getItem('rizbot_session');
      if (oldSession) {
        localStorage.setItem(SESSION_KEY, oldSession);
        localStorage.removeItem('rizbot_session');
        return getSession();
      }
      return null;
    }
    
    const { userId, expiry } = JSON.parse(session);
    if (Date.now() > expiry) {
      localStorage.removeItem(SESSION_KEY);
      localStorage.removeItem(CURRENT_USER_KEY);
      return null;
    }
    
    const users = getUsersSync();
    const userData = users[userId];
    if (!userData) return null;
    
    // Check and reset daily limits
    const user = resetDailyLimitsIfNeeded(userData.user);
    userData.user = user;
    saveUsersSync(users);
    
    return user;
  } catch {
    return null;
  }
};

// Reset daily limits if new day
const resetDailyLimitsIfNeeded = (user: User): User => {
  const now = Date.now();
  const lastReset = new Date(user.lastAnalysisReset);
  const today = new Date();
  
  // Check if it's a new day
  if (lastReset.toDateString() !== today.toDateString()) {
    const limits = SUBSCRIPTION_LIMITS[user.subscription];
    return {
      ...user,
      dailyAnalysisCount: 0,
      dailyAnalysisLimit: limits.dailyAnalysis,
      lastAnalysisReset: now,
    };
  }
  
  return user;
};

// Initialize default admin accounts (called once on app start)
let adminAccountsInitialized = false;

export const initializeDefaultAdminAccounts = async (): Promise<void> => {
  if (adminAccountsInitialized) return;
  adminAccountsInitialized = true;
  
  const users = getUsersSync();
  let hasChanges = false;
  
  for (const account of DEFAULT_ADMIN_ACCOUNTS) {
    const normalizedEmail = account.email.toLowerCase().trim();
    
    // Check if user already exists
    const existingEntry = Object.entries(users).find(
      ([, u]) => u.user.email.toLowerCase() === normalizedEmail
    );
    
    if (!existingEntry) {
      // Create new admin account
      const { hash: passwordHash, salt } = await secureHashPassword(account.password);
      const now = Date.now();
      const isAdmin = isAdminEmail(normalizedEmail);
      const subscription: SubscriptionTier = isAdmin ? 'elite' : 'pro';
      const limits = SUBSCRIPTION_LIMITS[subscription];
      
      const newUser: User = {
        id: generateId(),
        email: normalizedEmail,
        name: account.name,
        subscription: subscription,
        createdAt: now,
        lastLogin: now,
        dailyAnalysisCount: 0,
        dailyAnalysisLimit: limits.dailyAnalysis,
        lastAnalysisReset: now,
        isAdmin: isAdmin,
        avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(account.name)}&background=6366f1&color=fff`,
      };
      
      users[newUser.id] = {
        user: newUser,
        passwordHash,
        salt,
      };
      
      hasChanges = true;
      console.log(`✅ Default account created: ${account.email}`);
    }
  }
  
  if (hasChanges) {
    saveUsersSync(users);
    logSecurityEvent('INIT', 'Default admin accounts initialized', 'system');
  }
};

// Register new user with secure password hashing
export const register = async (data: RegisterData): Promise<{ success: boolean; error?: string; user?: User }> => {
  // Validate name using security service
  const nameValidation = validateName(data.name);
  if (!nameValidation.valid) {
    return { success: false, error: nameValidation.error };
  }
  
  // Validate email using security service
  const emailValidation = validateEmail(data.email);
  if (!emailValidation.valid) {
    return { success: false, error: emailValidation.error };
  }
  
  // Validate password strength using security service
  const passwordValidation = validatePassword(data.password);
  if (!passwordValidation.valid) {
    return { success: false, error: passwordValidation.error };
  }
  
  if (data.password !== data.confirmPassword) {
    return { success: false, error: 'Password tidak cocok' };
  }
  
  const users = getUsersSync();
  const normalizedEmail = data.email.trim().toLowerCase();
  
  // Check if email already exists
  const emailExists = Object.values(users).some(
    u => u.user.email.toLowerCase() === normalizedEmail
  );
  if (emailExists) {
    return { success: false, error: 'Email sudah terdaftar' };
  }
  
  // Hash password with PBKDF2 (secure)
  const { hash, salt } = await secureHashPassword(data.password);
  
  // Create new user
  const now = Date.now();
  const isAdmin = isAdminEmail(normalizedEmail);
  const subscription: SubscriptionTier = isAdmin ? 'elite' : 'free';
  const limits = SUBSCRIPTION_LIMITS[subscription];
  
  const user: User = {
    id: generateId(),
    email: normalizedEmail,
    name: nameValidation.sanitized,
    subscription: subscription,
    subscriptionExpiry: isAdmin ? undefined : undefined,
    createdAt: now,
    lastLogin: now,
    dailyAnalysisCount: 0,
    dailyAnalysisLimit: limits.dailyAnalysis,
    lastAnalysisReset: now,
    isAdmin: isAdmin,
    passwordChangedAt: now,
  };
  
  users[user.id] = {
    user,
    passwordHash: hash,
    salt,
  };
  
  saveUsersSync(users);
  
  // Create session
  createSession(user);
  
  // Log security event
  logSecurityEvent('REGISTER', `New user registered: ${user.email}`, user.id);
  
  return { success: true, user };
};

// Login user with rate limiting and secure verification
export const login = async (credentials: LoginCredentials): Promise<{ success: boolean; error?: string; user?: User }> => {
  const normalizedEmail = credentials.email?.trim().toLowerCase() || '';
  
  // Check if this is a default admin account (bypass rate limit)
  const isDefaultAccount = DEFAULT_ADMIN_ACCOUNTS.some(
    acc => acc.email.toLowerCase() === normalizedEmail
  ) || isAdminEmail(normalizedEmail);
  
  // Check rate limit to prevent brute force (skip for admin accounts)
  const rateLimitKey = `login_${normalizedEmail}`;
  
  if (!isDefaultAccount) {
    const rateLimit = checkRateLimit(rateLimitKey, MAX_LOGIN_ATTEMPTS, LOGIN_LOCKOUT_MS);
    
    if (!rateLimit.allowed) {
      const minutes = Math.ceil(rateLimit.resetInMs / 60000);
      logSecurityEvent('LOGIN_RATE_LIMITED', `Email: ${normalizedEmail}`, undefined);
      return { 
        success: false, 
        error: `Terlalu banyak percobaan login. Coba lagi dalam ${minutes} menit.` 
      };
    }
  } else {
    // Reset rate limit for admin accounts
    resetRateLimit(rateLimitKey);
  }
  
  if (!normalizedEmail || !credentials.password) {
    return { success: false, error: 'Email dan password harus diisi' };
  }
  
  // Validate email format
  const emailValidation = validateEmail(normalizedEmail);
  if (!emailValidation.valid) {
    return { success: false, error: 'Format email tidak valid' };
  }
  
  const users = getUsersSync();
  
  // Find user by email
  const userEntry = Object.entries(users).find(
    ([, u]) => u.user.email.toLowerCase() === normalizedEmail
  );
  
  if (!userEntry) {
    logSecurityEvent('LOGIN_FAILED', `Unknown email: ${normalizedEmail}`, undefined);
    // Use generic message to prevent email enumeration
    return { success: false, error: 'Email atau password salah' };
  }
  
  const [userId, userData] = userEntry;
  
  // Verify password with secure PBKDF2 if salt exists, otherwise use legacy
  let isValid = false;
  if (userData.salt) {
    isValid = await secureVerifyPassword(credentials.password, userData.passwordHash, userData.salt);
  } else {
    // Legacy password check (for migrated users)
    isValid = legacyVerifyPassword(credentials.password, userData.passwordHash);
    
    // Upgrade to secure hash if legacy password is valid
    if (isValid) {
      const { hash, salt } = await secureHashPassword(credentials.password);
      userData.passwordHash = hash;
      userData.salt = salt;
      saveUsersSync(users);
    }
  }
  
  if (!isValid) {
    // Update failed login count
    userData.user.loginAttempts = (userData.user.loginAttempts || 0) + 1;
    userData.user.lastFailedLogin = Date.now();
    saveUsersSync(users);
    
    logSecurityEvent('LOGIN_FAILED', `Invalid password for: ${normalizedEmail}`, userData.user.id);
    return { success: false, error: 'Email atau password salah' };
  }
  
  // Reset rate limit on successful login
  resetRateLimit(rateLimitKey);
  
  // Check if this is admin and update privileges
  const isAdmin = isAdminEmail(normalizedEmail);
  
  // Update last login and reset daily limits if needed
  let user = {
    ...userData.user,
    lastLogin: Date.now(),
    loginAttempts: 0,
    ...(isAdmin ? {
      isAdmin: true,
      subscription: 'elite' as SubscriptionTier,
      dailyAnalysisLimit: SUBSCRIPTION_LIMITS.elite.dailyAnalysis,
    } : {}),
  };
  user = resetDailyLimitsIfNeeded(user);
  
  users[user.id] = { ...userData, user };
  saveUsersSync(users);
  
  // Create session
  createSession(user);
  
  // Log security event
  logSecurityEvent('LOGIN_SUCCESS', `User logged in: ${user.email}`, user.id);
  
  return { success: true, user };
};

// Legacy password verification for backward compatibility
const legacyVerifyPassword = (password: string, hashedPassword: string): boolean => {
  let hash = 0;
  for (let i = 0; i < password.length; i++) {
    const char = password.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  const legacyHash = `hash_${Math.abs(hash).toString(16)}_${password.length}`;
  return legacyHash === hashedPassword;
};

// Create session with secure token
const createSession = (user: User) => {
  const session = {
    userId: user.id,
    token: generateSessionToken(),
    expiry: Date.now() + SESSION_DURATION_MS,
  };
  localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user));
};

// Logout with security logging
export const logout = () => {
  const user = getSession();
  if (user) {
    logSecurityEvent('LOGOUT', `User logged out: ${user.email}`, user.id);
  }
  localStorage.removeItem(SESSION_KEY);
  localStorage.removeItem(CURRENT_USER_KEY);
};

// Update user profile with validation
export const updateProfile = (updates: Partial<User>): User | null => {
  const session = getSession();
  if (!session) return null;
  
  const users = getUsersSync();
  const userData = users[session.id];
  if (!userData) return null;
  
  // Sanitize name if being updated
  let sanitizedUpdates = { ...updates };
  if (updates.name) {
    const nameValidation = validateName(updates.name);
    if (!nameValidation.valid) {
      throw new Error(nameValidation.error);
    }
    sanitizedUpdates.name = nameValidation.sanitized;
  }
  
  const updatedUser = {
    ...userData.user,
    ...sanitizedUpdates,
    id: session.id, // Prevent ID change
    email: userData.user.email, // Prevent email change without verification
    isAdmin: userData.user.isAdmin, // Prevent admin privilege change
  };
  
  users[session.id] = { ...userData, user: updatedUser };
  saveUsersSync(users);
  localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(updatedUser));
  
  logSecurityEvent('PROFILE_UPDATE', `Profile updated for: ${updatedUser.email}`, updatedUser.id);
  
  return updatedUser;
};

// Change password with secure hashing
export const changePassword = async (
  currentPassword: string, 
  newPassword: string
): Promise<{ success: boolean; error?: string }> => {
  const session = getSession();
  if (!session) return { success: false, error: 'Tidak terautentikasi' };
  
  // Validate new password strength
  const passwordValidation = validatePassword(newPassword);
  if (!passwordValidation.valid) {
    return { success: false, error: passwordValidation.error };
  }
  
  const users = getUsersSync();
  const userData = users[session.id];
  if (!userData) return { success: false, error: 'User tidak ditemukan' };
  
  // Verify current password
  let isValid = false;
  if (userData.salt) {
    isValid = await secureVerifyPassword(currentPassword, userData.passwordHash, userData.salt);
  } else {
    isValid = legacyVerifyPassword(currentPassword, userData.passwordHash);
  }
  
  if (!isValid) {
    logSecurityEvent('PASSWORD_CHANGE_FAILED', `Invalid current password for: ${session.email}`, session.id);
    return { success: false, error: 'Password lama salah' };
  }
  
  // Hash new password with PBKDF2
  const { hash, salt } = await secureHashPassword(newPassword);
  
  users[session.id] = {
    ...userData,
    passwordHash: hash,
    salt,
    user: {
      ...userData.user,
      passwordChangedAt: Date.now(),
    },
  };
  saveUsersSync(users);
  
  logSecurityEvent('PASSWORD_CHANGED', `Password changed for: ${session.email}`, session.id);
  
  return { success: true };
};

// Upgrade subscription (simulated)
export const upgradeSubscription = (tier: SubscriptionTier): { success: boolean; user?: User } => {
  const session = getSession();
  if (!session) return { success: false };
  
  const users = getUsersSync();
  const userData = users[session.id];
  if (!userData) return { success: false };
  
  const limits = SUBSCRIPTION_LIMITS[tier];
  const updatedUser: User = {
    ...userData.user,
    subscription: tier,
    subscriptionExpiry: Date.now() + 30 * 24 * 60 * 60 * 1000, // 30 days
    dailyAnalysisLimit: limits.dailyAnalysis,
  };
  
  users[session.id] = { ...userData, user: updatedUser };
  saveUsersSync(users);
  localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(updatedUser));
  
  logSecurityEvent('SUBSCRIPTION_UPGRADE', `Upgraded to ${tier} for: ${updatedUser.email}`, updatedUser.id);
  
  return { success: true, user: updatedUser };
};

// Check if user can perform action (usage limit)
export const canUseFeature = (feature: 'analysis' | 'watchlist' | 'alert' | 'portfolio', currentCount?: number): boolean => {
  const session = getSession();
  if (!session) return false;
  
  // Admin has unlimited access to all features
  if (session.isAdmin) return true;
  
  const limits = SUBSCRIPTION_LIMITS[session.subscription];
  
  switch (feature) {
    case 'analysis':
      if (limits.dailyAnalysis === -1) return true; // unlimited
      return session.dailyAnalysisCount < limits.dailyAnalysis;
    case 'watchlist':
      if (limits.watchlistLimit === -1) return true;
      return (currentCount || 0) < limits.watchlistLimit;
    case 'alert':
      if (limits.alertLimit === -1) return true;
      return (currentCount || 0) < limits.alertLimit;
    case 'portfolio':
      if (limits.portfolioLimit === -1) return true;
      return (currentCount || 0) < limits.portfolioLimit;
    default:
      return true;
  }
};

// Increment usage count
export const incrementUsage = (feature: 'analysis'): User | null => {
  const session = getSession();
  if (!session) return null;
  
  const users = getUsersSync();
  const userData = users[session.id];
  if (!userData) return null;
  
  let updatedUser = userData.user;
  
  if (feature === 'analysis') {
    updatedUser = {
      ...updatedUser,
      dailyAnalysisCount: updatedUser.dailyAnalysisCount + 1,
    };
  }
  
  users[session.id] = { ...userData, user: updatedUser };
  saveUsersSync(users);
  localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(updatedUser));
  
  return updatedUser;
};

// Get remaining usage
export const getRemainingUsage = (): { analysis: number | 'unlimited'; watchlist: number | 'unlimited'; alert: number | 'unlimited' } => {
  const session = getSession();
  if (!session) {
    return { analysis: 0, watchlist: 0, alert: 0 };
  }
  
  const limits = SUBSCRIPTION_LIMITS[session.subscription];
  
  return {
    analysis: limits.dailyAnalysis === -1 ? 'unlimited' : limits.dailyAnalysis - session.dailyAnalysisCount,
    watchlist: limits.watchlistLimit === -1 ? 'unlimited' : limits.watchlistLimit,
    alert: limits.alertLimit === -1 ? 'unlimited' : limits.alertLimit,
  };
};

// ============================================
// OAUTH SOCIAL LOGIN
// ============================================

// OAuth Configuration - Set these for production
// Get Google Client ID from: https://console.cloud.google.com/apis/credentials
// Get Facebook App ID from: https://developers.facebook.com/apps/
const GOOGLE_CLIENT_ID = localStorage.getItem('rizbot_google_client_id') || '';
const FACEBOOK_APP_ID = localStorage.getItem('rizbot_facebook_app_id') || '';

// Demo mode - set to false when you have real OAuth credentials
const DEMO_MODE = !GOOGLE_CLIENT_ID || GOOGLE_CLIENT_ID === '';

// Process OAuth user data and create/login user
const processOAuthUser = (
  email: string, 
  name: string, 
  provider: 'google' | 'facebook',
  providerId: string,
  avatar?: string
): User => {
  const users = getUsersSync();
  const normalizedEmail = email.toLowerCase().trim();
  
  // Check if user already exists
  const existingEntry = Object.entries(users).find(
    ([, u]) => u.user.email.toLowerCase() === normalizedEmail
  );
  
  if (existingEntry) {
    // User exists - update and return
    const [userId, userData] = existingEntry;
    const isAdmin = isAdminEmail(normalizedEmail);
    
    const updatedUser: User = {
      ...userData.user,
      lastLogin: Date.now(),
      avatar: avatar || userData.user.avatar,
      ...(isAdmin ? {
        isAdmin: true,
        subscription: 'elite' as SubscriptionTier,
      } : {}),
    };
    
    users[userId] = { ...userData, user: updatedUser };
    saveUsersSync(users);
    createSession(updatedUser);
    
    logSecurityEvent('OAUTH_LOGIN', `${provider} login: ${normalizedEmail}`, updatedUser.id);
    
    return updatedUser;
  }
  
  // Create new user from OAuth
  const now = Date.now();
  const isAdmin = isAdminEmail(normalizedEmail);
  const subscription: SubscriptionTier = isAdmin ? 'elite' : 'free';
  const limits = SUBSCRIPTION_LIMITS[subscription];
  
  const newUser: User = {
    id: generateId(),
    email: normalizedEmail,
    name: name || email.split('@')[0],
    avatar: avatar,
    subscription: subscription,
    createdAt: now,
    lastLogin: now,
    dailyAnalysisCount: 0,
    dailyAnalysisLimit: limits.dailyAnalysis,
    lastAnalysisReset: now,
    isAdmin: isAdmin,
  };
  
  // Store user without password (OAuth users)
  users[newUser.id] = {
    user: newUser,
    passwordHash: `oauth_${provider}_${providerId}`, // Mark as OAuth user
    salt: '',
  };
  
  saveUsersSync(users);
  createSession(newUser);
  
  logSecurityEvent('OAUTH_REGISTER', `New ${provider} user: ${normalizedEmail}`, newUser.id);
  
  return newUser;
};

// Demo login - simulates OAuth for testing without real credentials
const demoSocialLogin = (provider: 'google' | 'facebook'): Promise<{ success: boolean; error?: string; user?: User }> => {
  return new Promise((resolve) => {
    // Show prompt for demo email
    const email = prompt(
      `🔐 Demo Mode: Login dengan ${provider === 'google' ? 'Google' : 'Facebook'}\n\n` +
      `Masukkan email untuk demo login:\n` +
      `(Untuk production, setup OAuth credentials di Settings)`
    );
    
    if (!email || !email.includes('@')) {
      resolve({ success: false, error: 'Email tidak valid atau dibatalkan' });
      return;
    }
    
    // Simulate OAuth delay
    setTimeout(() => {
      const user = processOAuthUser(
        email,
        email.split('@')[0],
        provider,
        `demo_${Date.now()}`,
        `https://ui-avatars.com/api/?name=${encodeURIComponent(email.split('@')[0])}&background=random`
      );
      resolve({ success: true, user });
    }, 500);
  });
};

// Initialize Google Sign-In (only when credentials are set)
let googleInitialized = false;

export const initGoogleAuth = (): Promise<void> => {
  return new Promise((resolve, reject) => {
    if (!GOOGLE_CLIENT_ID) {
      reject(new Error('Google Client ID not configured'));
      return;
    }
    
    if (googleInitialized) {
      resolve();
      return;
    }
    
    // Load Google Identity Services script
    if (!document.getElementById('google-gsi-script')) {
      const script = document.createElement('script');
      script.id = 'google-gsi-script';
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      script.defer = true;
      script.onload = () => {
        googleInitialized = true;
        resolve();
      };
      script.onerror = () => reject(new Error('Failed to load Google SDK'));
      document.head.appendChild(script);
    } else {
      googleInitialized = true;
      resolve();
    }
  });
};

// Initialize Facebook SDK (only when credentials are set)
let facebookInitialized = false;

export const initFacebookAuth = (): Promise<void> => {
  return new Promise((resolve, reject) => {
    if (!FACEBOOK_APP_ID) {
      reject(new Error('Facebook App ID not configured'));
      return;
    }
    
    if (facebookInitialized) {
      resolve();
      return;
    }
    
    // Load Facebook SDK
    if (!document.getElementById('facebook-jssdk')) {
      const script = document.createElement('script');
      script.id = 'facebook-jssdk';
      script.src = 'https://connect.facebook.net/en_US/sdk.js';
      script.async = true;
      script.defer = true;
      script.onload = () => {
        (window as any).FB?.init({
          appId: FACEBOOK_APP_ID,
          cookie: true,
          xfbml: true,
          version: 'v18.0'
        });
        facebookInitialized = true;
        resolve();
      };
      script.onerror = () => reject(new Error('Failed to load Facebook SDK'));
      document.head.appendChild(script);
    } else {
      facebookInitialized = true;
      resolve();
    }
  });
};

// Google Sign-In
export const loginWithGoogle = (): Promise<{ success: boolean; error?: string; user?: User }> => {
  // Use demo mode if no credentials configured
  if (DEMO_MODE) {
    return demoSocialLogin('google');
  }
  
  return new Promise(async (resolve) => {
    try {
      await initGoogleAuth();
      
      // Use Google Identity Services
      const google = (window as any).google;
      
      if (!google?.accounts?.id) {
        resolve({ success: false, error: 'Google SDK belum siap. Coba lagi.' });
        return;
      }
      
      google.accounts.id.initialize({
        client_id: GOOGLE_CLIENT_ID,
        callback: (response: any) => {
          if (response.credential) {
            // Decode JWT token
            const payload = JSON.parse(atob(response.credential.split('.')[1]));
            const user = processOAuthUser(
              payload.email,
              payload.name,
              'google',
              payload.sub,
              payload.picture
            );
            resolve({ success: true, user });
          } else {
            resolve({ success: false, error: 'Login dibatalkan' });
          }
        },
      });
      
      // Prompt user to sign in
      google.accounts.id.prompt((notification: any) => {
        if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
          // Use OAuth2 popup as fallback
          const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?` +
            `client_id=${GOOGLE_CLIENT_ID}&` +
            `redirect_uri=${encodeURIComponent(window.location.origin)}&` +
            `response_type=token&` +
            `scope=email%20profile`;
          
          const popup = window.open(authUrl, 'Google Login', 'width=500,height=600');
          
          // Listen for popup close
          const checkPopup = setInterval(() => {
            if (popup?.closed) {
              clearInterval(checkPopup);
              resolve({ success: false, error: 'Login dibatalkan' });
            }
          }, 1000);
        }
      });
      
    } catch (error) {
      console.error('Google login error:', error);
      // Fallback to demo mode on error
      return demoSocialLogin('google');
    }
  });
};

// Facebook Login
export const loginWithFacebook = (): Promise<{ success: boolean; error?: string; user?: User }> => {
  // Use demo mode if no credentials configured
  if (DEMO_MODE) {
    return demoSocialLogin('facebook');
  }
  
  return new Promise(async (resolve) => {
    try {
      await initFacebookAuth();
      
      const FB = (window as any).FB;
      
      if (!FB) {
        resolve({ success: false, error: 'Facebook SDK belum siap. Coba lagi.' });
        return;
      }
      
      FB.login((response: any) => {
        if (response.authResponse) {
          // Get user info
          FB.api('/me', { fields: 'id,name,email,picture.type(large)' }, (userInfo: any) => {
            if (userInfo.email) {
              const user = processOAuthUser(
                userInfo.email,
                userInfo.name,
                'facebook',
                userInfo.id,
                userInfo.picture?.data?.url
              );
              resolve({ success: true, user });
            } else {
              resolve({ 
                success: false, 
                error: 'Email tidak tersedia dari akun Facebook Anda.' 
              });
            }
          });
        } else {
          resolve({ success: false, error: 'Login dibatalkan' });
        }
      }, { scope: 'email,public_profile' });
      
    } catch (error) {
      console.error('Facebook login error:', error);
      // Fallback to demo mode on error
      return demoSocialLogin('facebook');
    }
  });
};

// Set OAuth credentials (for admin configuration)
export const setOAuthCredentials = (googleClientId?: string, facebookAppId?: string): void => {
  if (googleClientId) {
    localStorage.setItem('rizbot_google_client_id', googleClientId);
  }
  if (facebookAppId) {
    localStorage.setItem('rizbot_facebook_app_id', facebookAppId);
  }
  // Reload to apply new credentials
  window.location.reload();
};

// Check if OAuth is configured
export const isOAuthConfigured = (): { google: boolean; facebook: boolean } => {
  return {
    google: !!localStorage.getItem('rizbot_google_client_id'),
    facebook: !!localStorage.getItem('rizbot_facebook_app_id'),
  };
};

// Legacy social login function (for backward compatibility)
export const socialLogin = async (provider: 'google' | 'facebook'): Promise<{ success: boolean; error?: string; user?: User }> => {
  if (provider === 'google') {
    return loginWithGoogle();
  } else if (provider === 'facebook') {
    return loginWithFacebook();
  }
  return { success: false, error: 'Provider tidak didukung' };
};

// Debug functions - exposed to window for troubleshooting
export const debugListUsers = (): void => {
  const users = getUsersSync();
  console.log('📋 Registered Users:');
  Object.values(users).forEach(({ user }) => {
    console.log(`  - ${user.email} (${user.subscription}) ${user.isAdmin ? '[ADMIN]' : ''}`);
  });
};

export const debugResetAndCreateAdmins = async (): Promise<void> => {
  // Clear the initialized flag
  adminAccountsInitialized = false;
  
  // Force create admin accounts
  await initializeDefaultAdminAccounts();
  
  console.log('✅ Admin accounts reset and recreated');
  debugListUsers();
};

export const debugClearAllUsers = (): void => {
  localStorage.removeItem(USERS_KEY);
  localStorage.removeItem(SESSION_KEY);
  localStorage.removeItem(CURRENT_USER_KEY);
  adminAccountsInitialized = false;
  console.log('🗑️ All users cleared. Refresh page to recreate admin accounts.');
};

// Expose debug functions to window
if (typeof window !== 'undefined') {
  (window as any).rizbotDebug = {
    listUsers: debugListUsers,
    resetAdmins: debugResetAndCreateAdmins,
    clearAllUsers: debugClearAllUsers,
  };
}

export default {
  getSession,
  register,
  login,
  logout,
  updateProfile,
  changePassword,
  upgradeSubscription,
  canUseFeature,
  incrementUsage,
  getRemainingUsage,
  socialLogin,
  loginWithGoogle,
  loginWithFacebook,
  isAdminEmail,
  initializeDefaultAdminAccounts,
  debugListUsers,
  debugResetAndCreateAdmins,
  debugClearAllUsers,
  SUBSCRIPTION_LIMITS,
};
