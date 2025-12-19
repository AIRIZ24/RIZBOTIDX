/**
 * Security Service
 * Handles encryption, secure hashing, and data protection
 * 
 * ⚠️ DISCLAIMER: This is a frontend-only security implementation.
 * For production, you MUST use a backend server with:
 * - bcrypt/argon2 for password hashing
 * - JWT tokens stored in httpOnly cookies
 * - Server-side session management
 * - Encrypted database storage
 */

// ============================================
// CONSTANTS
// ============================================

const PBKDF2_ITERATIONS = 100000; // High iteration count for security
const SALT_LENGTH = 32;
const KEY_LENGTH = 256;
const IV_LENGTH = 12; // GCM recommended IV length
const ENCRYPTION_KEY_STORAGE = 'rizbot_ek_v2';

// ============================================
// CRYPTO UTILITIES
// ============================================

/**
 * Convert ArrayBuffer to Base64 string
 */
const bufferToBase64 = (buffer: ArrayBuffer): string => {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
};

/**
 * Convert Base64 string to ArrayBuffer
 */
const base64ToBuffer = (base64: string): ArrayBuffer => {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
};

/**
 * Generate cryptographically secure random bytes
 */
const getRandomBytes = (length: number): Uint8Array => {
  return crypto.getRandomValues(new Uint8Array(length));
};

/**
 * Generate a random salt for password hashing
 */
export const generateSalt = (): string => {
  const bytes = getRandomBytes(SALT_LENGTH);
  return bufferToBase64(bytes.buffer as ArrayBuffer);
};

// ============================================
// PASSWORD HASHING (PBKDF2)
// ============================================

/**
 * Hash password using PBKDF2 with SHA-256
 * This is much more secure than the simple hash previously used
 */
export const hashPassword = async (password: string, salt?: string): Promise<{ hash: string; salt: string }> => {
  const actualSalt = salt || generateSalt();
  const saltBuffer = base64ToBuffer(actualSalt);
  
  // Import password as key material
  const encoder = new TextEncoder();
  const passwordBuffer = encoder.encode(password);
  
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    passwordBuffer,
    'PBKDF2',
    false,
    ['deriveBits']
  );
  
  // Derive key using PBKDF2
  const derivedBits = await crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      salt: saltBuffer,
      iterations: PBKDF2_ITERATIONS,
      hash: 'SHA-256',
    },
    keyMaterial,
    KEY_LENGTH
  );
  
  return {
    hash: bufferToBase64(derivedBits),
    salt: actualSalt,
  };
};

/**
 * Verify password against stored hash
 */
export const verifyPassword = async (password: string, storedHash: string, salt: string): Promise<boolean> => {
  try {
    const { hash } = await hashPassword(password, salt);
    // Use timing-safe comparison to prevent timing attacks
    return timingSafeEqual(hash, storedHash);
  } catch {
    return false;
  }
};

/**
 * Timing-safe string comparison to prevent timing attacks
 */
const timingSafeEqual = (a: string, b: string): boolean => {
  if (a.length !== b.length) {
    return false;
  }
  
  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  
  return result === 0;
};

// ============================================
// DATA ENCRYPTION (AES-GCM)
// ============================================

/**
 * Get or generate encryption key for localStorage data
 */
const getEncryptionKey = async (): Promise<CryptoKey> => {
  const stored = sessionStorage.getItem(ENCRYPTION_KEY_STORAGE);
  
  if (stored) {
    try {
      const keyData = base64ToBuffer(stored);
      return await crypto.subtle.importKey(
        'raw',
        keyData,
        { name: 'AES-GCM', length: 256 },
        true,
        ['encrypt', 'decrypt']
      );
    } catch {
      // Key corrupted, generate new one
    }
  }
  
  // Generate new key
  const key = await crypto.subtle.generateKey(
    { name: 'AES-GCM', length: 256 },
    true,
    ['encrypt', 'decrypt']
  );
  
  // Export and store key
  const exportedKey = await crypto.subtle.exportKey('raw', key);
  sessionStorage.setItem(ENCRYPTION_KEY_STORAGE, bufferToBase64(exportedKey));
  
  return key;
};

/**
 * Encrypt sensitive data using AES-GCM
 */
export const encryptData = async (data: string): Promise<string> => {
  try {
    const key = await getEncryptionKey();
    const encoder = new TextEncoder();
    const dataBuffer = encoder.encode(data);
    
    // Generate random IV
    const iv = getRandomBytes(IV_LENGTH);
    
    // Encrypt
    const encrypted = await crypto.subtle.encrypt(
      { name: 'AES-GCM', iv: iv.buffer as ArrayBuffer },
      key,
      dataBuffer
    );
    
    // Combine IV + encrypted data
    const combined = new Uint8Array(IV_LENGTH + encrypted.byteLength);
    combined.set(iv, 0);
    combined.set(new Uint8Array(encrypted), IV_LENGTH);
    
    return bufferToBase64(combined.buffer as ArrayBuffer);
  } catch (error) {
    console.error('Encryption failed:', error);
    throw new Error('Failed to encrypt data');
  }
};

/**
 * Decrypt data encrypted with AES-GCM
 */
export const decryptData = async (encryptedData: string): Promise<string> => {
  try {
    const key = await getEncryptionKey();
    const combined = new Uint8Array(base64ToBuffer(encryptedData));
    
    // Extract IV and encrypted data
    const iv = combined.slice(0, IV_LENGTH);
    const encrypted = combined.slice(IV_LENGTH);
    
    // Decrypt
    const decrypted = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv },
      key,
      encrypted
    );
    
    const decoder = new TextDecoder();
    return decoder.decode(decrypted);
  } catch (error) {
    console.error('Decryption failed:', error);
    throw new Error('Failed to decrypt data');
  }
};

// ============================================
// SECURE STORAGE
// ============================================

/**
 * Securely store data in localStorage with encryption
 */
export const secureStore = async (key: string, data: any): Promise<void> => {
  try {
    const jsonData = JSON.stringify(data);
    const encrypted = await encryptData(jsonData);
    localStorage.setItem(key, encrypted);
  } catch (error) {
    console.error('Secure store failed:', error);
    // Fallback to regular storage with warning
    console.warn('⚠️ Falling back to unencrypted storage');
    localStorage.setItem(key, JSON.stringify(data));
  }
};

/**
 * Retrieve and decrypt data from localStorage
 */
export const secureRetrieve = async <T>(key: string): Promise<T | null> => {
  try {
    const stored = localStorage.getItem(key);
    if (!stored) return null;
    
    // Try to decrypt
    try {
      const decrypted = await decryptData(stored);
      return JSON.parse(decrypted) as T;
    } catch {
      // Might be old unencrypted data, try to parse directly
      try {
        return JSON.parse(stored) as T;
      } catch {
        return null;
      }
    }
  } catch {
    return null;
  }
};

// ============================================
// INPUT VALIDATION & SANITIZATION
// ============================================

/**
 * Validate email format
 */
export const validateEmail = (email: string): { valid: boolean; error?: string } => {
  if (!email || typeof email !== 'string') {
    return { valid: false, error: 'Email harus diisi' };
  }
  
  const trimmed = email.trim().toLowerCase();
  
  if (trimmed.length === 0) {
    return { valid: false, error: 'Email harus diisi' };
  }
  
  if (trimmed.length > 254) {
    return { valid: false, error: 'Email terlalu panjang' };
  }
  
  // RFC 5322 compliant email regex (simplified)
  const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
  
  if (!emailRegex.test(trimmed)) {
    return { valid: false, error: 'Format email tidak valid' };
  }
  
  return { valid: true };
};

/**
 * Validate password strength
 */
export const validatePassword = (password: string): { valid: boolean; error?: string; strength: 'weak' | 'medium' | 'strong' } => {
  if (!password || typeof password !== 'string') {
    return { valid: false, error: 'Password harus diisi', strength: 'weak' };
  }
  
  if (password.length < 8) {
    return { valid: false, error: 'Password minimal 8 karakter', strength: 'weak' };
  }
  
  if (password.length > 128) {
    return { valid: false, error: 'Password terlalu panjang', strength: 'weak' };
  }
  
  // Check for common patterns
  const commonPasswords = ['password', '12345678', 'qwerty123', 'letmein', 'admin123'];
  if (commonPasswords.includes(password.toLowerCase())) {
    return { valid: false, error: 'Password terlalu umum', strength: 'weak' };
  }
  
  // Calculate strength
  let score = 0;
  
  // Length bonus
  if (password.length >= 12) score += 2;
  else if (password.length >= 8) score += 1;
  
  // Character variety
  if (/[a-z]/.test(password)) score += 1;
  if (/[A-Z]/.test(password)) score += 1;
  if (/[0-9]/.test(password)) score += 1;
  if (/[^a-zA-Z0-9]/.test(password)) score += 2;
  
  let strength: 'weak' | 'medium' | 'strong' = 'weak';
  if (score >= 6) strength = 'strong';
  else if (score >= 4) strength = 'medium';
  
  // Require at least medium strength
  if (strength === 'weak') {
    return { 
      valid: false, 
      error: 'Password harus mengandung huruf besar, huruf kecil, angka, atau simbol', 
      strength 
    };
  }
  
  return { valid: true, strength };
};

/**
 * Validate and sanitize name
 */
export const validateName = (name: string): { valid: boolean; error?: string; sanitized: string } => {
  if (!name || typeof name !== 'string') {
    return { valid: false, error: 'Nama harus diisi', sanitized: '' };
  }
  
  // Trim and remove multiple spaces
  const sanitized = name.trim().replace(/\s+/g, ' ');
  
  if (sanitized.length < 2) {
    return { valid: false, error: 'Nama minimal 2 karakter', sanitized };
  }
  
  if (sanitized.length > 100) {
    return { valid: false, error: 'Nama maksimal 100 karakter', sanitized };
  }
  
  // Allow letters, spaces, hyphens, apostrophes (for names like O'Brien)
  const nameRegex = /^[a-zA-Z\u00C0-\u024F\u1E00-\u1EFF\s\-']+$/;
  if (!nameRegex.test(sanitized)) {
    return { valid: false, error: 'Nama hanya boleh berisi huruf', sanitized };
  }
  
  return { valid: true, sanitized };
};

/**
 * Sanitize string to prevent XSS
 */
export const sanitizeString = (input: string): string => {
  if (!input || typeof input !== 'string') return '';
  
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
    .trim();
};

/**
 * Validate stock symbol
 */
export const validateSymbol = (symbol: string): { valid: boolean; error?: string; sanitized: string } => {
  if (!symbol || typeof symbol !== 'string') {
    return { valid: false, error: 'Symbol harus diisi', sanitized: '' };
  }
  
  const sanitized = symbol.trim().toUpperCase();
  
  if (sanitized.length < 1 || sanitized.length > 10) {
    return { valid: false, error: 'Symbol tidak valid', sanitized };
  }
  
  // Allow alphanumeric, dots (for US stocks), hyphens (for crypto)
  const symbolRegex = /^[A-Z0-9.\-]+$/;
  if (!symbolRegex.test(sanitized)) {
    return { valid: false, error: 'Symbol mengandung karakter tidak valid', sanitized };
  }
  
  return { valid: true, sanitized };
};

/**
 * Validate number input
 */
export const validateNumber = (
  value: any, 
  options: { min?: number; max?: number; allowNegative?: boolean; fieldName?: string } = {}
): { valid: boolean; error?: string; value: number } => {
  const { min, max, allowNegative = false, fieldName = 'Nilai' } = options;
  
  const num = typeof value === 'string' ? parseFloat(value) : value;
  
  if (isNaN(num) || !isFinite(num)) {
    return { valid: false, error: `${fieldName} harus berupa angka`, value: 0 };
  }
  
  if (!allowNegative && num < 0) {
    return { valid: false, error: `${fieldName} tidak boleh negatif`, value: num };
  }
  
  if (min !== undefined && num < min) {
    return { valid: false, error: `${fieldName} minimal ${min}`, value: num };
  }
  
  if (max !== undefined && num > max) {
    return { valid: false, error: `${fieldName} maksimal ${max}`, value: num };
  }
  
  return { valid: true, value: num };
};

// ============================================
// RATE LIMITING
// ============================================

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

const rateLimitStore = new Map<string, RateLimitEntry>();

/**
 * Check if action is rate limited
 */
export const checkRateLimit = (
  key: string, 
  maxAttempts: number, 
  windowMs: number
): { allowed: boolean; remainingAttempts: number; resetInMs: number } => {
  const now = Date.now();
  const entry = rateLimitStore.get(key);
  
  // Clean expired entry
  if (entry && now >= entry.resetTime) {
    rateLimitStore.delete(key);
  }
  
  const currentEntry = rateLimitStore.get(key);
  
  if (!currentEntry) {
    // First attempt
    rateLimitStore.set(key, { count: 1, resetTime: now + windowMs });
    return { allowed: true, remainingAttempts: maxAttempts - 1, resetInMs: windowMs };
  }
  
  if (currentEntry.count >= maxAttempts) {
    return { 
      allowed: false, 
      remainingAttempts: 0, 
      resetInMs: currentEntry.resetTime - now 
    };
  }
  
  // Increment count
  currentEntry.count++;
  rateLimitStore.set(key, currentEntry);
  
  return { 
    allowed: true, 
    remainingAttempts: maxAttempts - currentEntry.count, 
    resetInMs: currentEntry.resetTime - now 
  };
};

/**
 * Reset rate limit for a key
 */
export const resetRateLimit = (key: string): void => {
  rateLimitStore.delete(key);
};

/**
 * Clear all rate limits (useful for admin troubleshooting)
 */
export const clearAllRateLimits = (): void => {
  rateLimitStore.clear();
  console.log('✅ All rate limits cleared');
};

// Expose to window for debugging
if (typeof window !== 'undefined') {
  (window as any).clearAllRateLimits = clearAllRateLimits;
}

// ============================================
// SESSION SECURITY
// ============================================

/**
 * Generate secure session token
 */
export const generateSessionToken = (): string => {
  const bytes = getRandomBytes(32);
  return bufferToBase64(bytes.buffer as ArrayBuffer);
};

/**
 * Generate CSRF token
 */
export const generateCSRFToken = (): string => {
  const bytes = getRandomBytes(32);
  const token = bufferToBase64(bytes.buffer as ArrayBuffer);
  sessionStorage.setItem('rizbot_csrf', token);
  return token;
};

/**
 * Validate CSRF token
 */
export const validateCSRFToken = (token: string): boolean => {
  const stored = sessionStorage.getItem('rizbot_csrf');
  if (!stored || !token) return false;
  return timingSafeEqual(token, stored);
};

// ============================================
// API KEY PROTECTION
// ============================================

// Obfuscated key parts (NOT truly secure, but better than plaintext)
// In production, API calls should go through your backend server
const KEY_PARTS = [
  'QUl6YVN5', // Obfuscated parts
  'QjF3cjFz',
  'QkstaUhI',
  'MFlnTEpN',
  'VkNjb2FR',
];

// Vite environment variables type declaration
declare const import_meta_env: {
  VITE_GEMINI_API_KEY?: string;
  GEMINI_API_KEY?: string;
  DEV?: boolean;
  PROD?: boolean;
};

/**
 * Get API key for RIZBOT AI
 * ⚠️ WARNING: This is not secure for production!
 * In production, ALL API calls should go through your backend server.
 */
export const getSecureAPIKey = (): string => {
  // First check environment variable (preferred)
  // @ts-ignore - Vite injects these at build time
  const envKey = (typeof import.meta !== 'undefined' && import.meta.env?.VITE_GEMINI_API_KEY) || 
                 // @ts-ignore
                 (typeof import.meta !== 'undefined' && import.meta.env?.GEMINI_API_KEY) ||
                 process.env.VITE_GEMINI_API_KEY ||
                 process.env.GEMINI_API_KEY;
  
  if (envKey) {
    return envKey;
  }
  
  // Check localStorage for user-provided key
  const storedKey = localStorage.getItem('rizbot_user_api_key');
  if (storedKey) {
    return storedKey;
  }
  
  // Log warning in development
  // @ts-ignore
  if (typeof import.meta !== 'undefined' && import.meta.env?.DEV) {
    console.warn('⚠️ No API key found. Please configure RIZBOT AI Key in Settings.');
  }
  
  throw new Error('API Key tidak ditemukan. Silakan masukkan RIZBOT AI Key Anda di menu Settings.');
};

/**
 * Set user-provided API key
 */
export const setUserAPIKey = (apiKey: string): void => {
  if (!apiKey || apiKey.length < 20) {
    throw new Error('API Key tidak valid');
  }
  localStorage.setItem('rizbot_user_api_key', apiKey);
};

/**
 * Remove user API key
 */
export const removeUserAPIKey = (): void => {
  localStorage.removeItem('rizbot_user_api_key');
};

/**
 * Check if user has API key set
 */
export const hasAPIKey = (): boolean => {
  try {
    getSecureAPIKey();
    return true;
  } catch {
    return false;
  }
};

// ============================================
// AUDIT LOGGING
// ============================================

interface AuditLog {
  timestamp: number;
  action: string;
  userId?: string;
  details?: string;
  ip?: string;
}

const AUDIT_LOG_KEY = 'rizbot_audit_log';
const MAX_AUDIT_LOGS = 100;

/**
 * Log security-relevant action
 */
export const logSecurityEvent = (action: string, details?: string, userId?: string): void => {
  try {
    const logs: AuditLog[] = JSON.parse(localStorage.getItem(AUDIT_LOG_KEY) || '[]');
    
    logs.unshift({
      timestamp: Date.now(),
      action,
      userId,
      details,
    });
    
    // Keep only last N logs
    if (logs.length > MAX_AUDIT_LOGS) {
      logs.length = MAX_AUDIT_LOGS;
    }
    
    localStorage.setItem(AUDIT_LOG_KEY, JSON.stringify(logs));
  } catch {
    // Silently fail - audit logging should not break the app
  }
};

/**
 * Get audit logs
 */
export const getAuditLogs = (): AuditLog[] => {
  try {
    return JSON.parse(localStorage.getItem(AUDIT_LOG_KEY) || '[]');
  } catch {
    return [];
  }
};

// ============================================
// EXPORTS
// ============================================

export default {
  // Password
  hashPassword,
  verifyPassword,
  generateSalt,
  
  // Encryption
  encryptData,
  decryptData,
  secureStore,
  secureRetrieve,
  
  // Validation
  validateEmail,
  validatePassword,
  validateName,
  validateSymbol,
  validateNumber,
  sanitizeString,
  
  // Rate Limiting
  checkRateLimit,
  resetRateLimit,
  
  // Session
  generateSessionToken,
  generateCSRFToken,
  validateCSRFToken,
  
  // API Key
  getSecureAPIKey,
  setUserAPIKey,
  removeUserAPIKey,
  hasAPIKey,
  
  // Audit
  logSecurityEvent,
  getAuditLogs,
};
