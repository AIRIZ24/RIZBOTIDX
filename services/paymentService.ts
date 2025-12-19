/**
 * Payment Service
 * Integration with Midtrans/Xendit for payment processing
 * Supports: DANA e-wallet, BNI Virtual Account
 * 
 * NOTE: This is a frontend simulation. In production:
 * - Use backend server to generate payment tokens
 * - Never expose API keys in frontend
 * - Implement webhook handlers for payment notifications
 */

export type PaymentMethod = 'dana' | 'bni_va' | 'gopay' | 'ovo' | 'bca_va' | 'mandiri_va' | 'credit_card';
export type PaymentStatus = 'pending' | 'processing' | 'success' | 'failed' | 'expired' | 'cancelled';
export type PaymentProvider = 'midtrans' | 'xendit';

export interface PaymentMethodInfo {
  id: PaymentMethod;
  name: string;
  provider: PaymentProvider;
  type: 'ewallet' | 'va' | 'card';
  icon: string;
  description: string;
  processingTime: string;
  fee: number; // percentage
  minAmount: number;
  maxAmount: number;
  enabled: boolean;
}

export interface PaymentRequest {
  orderId: string;
  amount: number;
  currency: string;
  description: string;
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  paymentMethod: PaymentMethod;
  metadata?: Record<string, any>;
}

export interface PaymentResponse {
  success: boolean;
  transactionId: string;
  orderId: string;
  status: PaymentStatus;
  paymentMethod: PaymentMethod;
  amount: number;
  fee: number;
  totalAmount: number;
  currency: string;
  // For VA payments
  vaNumber?: string;
  bankCode?: string;
  expiryTime?: string;
  // For e-wallet payments
  paymentUrl?: string;
  qrCodeUrl?: string;
  deepLinkUrl?: string;
  // Timestamps
  createdAt: string;
  updatedAt: string;
  paidAt?: string;
  // Error info
  errorCode?: string;
  errorMessage?: string;
}

export interface PaymentTransaction {
  id: string;
  orderId: string;
  userId: string;
  amount: number;
  fee: number;
  totalAmount: number;
  currency: string;
  status: PaymentStatus;
  paymentMethod: PaymentMethod;
  provider: PaymentProvider;
  description: string;
  vaNumber?: string;
  paymentUrl?: string;
  expiryTime: string;
  createdAt: string;
  updatedAt: string;
  paidAt?: string;
}

// Storage key
const TRANSACTIONS_KEY = 'rizbot_payment_transactions';

// Available payment methods
export const PAYMENT_METHODS: PaymentMethodInfo[] = [
  {
    id: 'dana',
    name: 'DANA',
    provider: 'xendit',
    type: 'ewallet',
    icon: '💙',
    description: 'Bayar langsung dengan saldo DANA',
    processingTime: 'Instan',
    fee: 1.5,
    minAmount: 10000,
    maxAmount: 10000000,
    enabled: true,
  },
  {
    id: 'bni_va',
    name: 'BNI Virtual Account',
    provider: 'midtrans',
    type: 'va',
    icon: '🏦',
    description: 'Transfer via ATM/Mobile Banking BNI',
    processingTime: '1-5 menit',
    fee: 0,
    minAmount: 10000,
    maxAmount: 999999999,
    enabled: true,
  },
  {
    id: 'gopay',
    name: 'GoPay',
    provider: 'midtrans',
    type: 'ewallet',
    icon: '💚',
    description: 'Bayar dengan GoPay',
    processingTime: 'Instan',
    fee: 2,
    minAmount: 1000,
    maxAmount: 10000000,
    enabled: true,
  },
  {
    id: 'ovo',
    name: 'OVO',
    provider: 'xendit',
    type: 'ewallet',
    icon: '💜',
    description: 'Bayar dengan OVO',
    processingTime: 'Instan',
    fee: 2,
    minAmount: 10000,
    maxAmount: 10000000,
    enabled: true,
  },
  {
    id: 'bca_va',
    name: 'BCA Virtual Account',
    provider: 'midtrans',
    type: 'va',
    icon: '🏦',
    description: 'Transfer via ATM/Mobile Banking BCA',
    processingTime: '1-5 menit',
    fee: 0,
    minAmount: 10000,
    maxAmount: 999999999,
    enabled: true,
  },
  {
    id: 'mandiri_va',
    name: 'Mandiri Virtual Account',
    provider: 'midtrans',
    type: 'va',
    icon: '🏦',
    description: 'Transfer via ATM/Mobile Banking Mandiri',
    processingTime: '1-5 menit',
    fee: 0,
    minAmount: 10000,
    maxAmount: 999999999,
    enabled: true,
  },
  {
    id: 'credit_card',
    name: 'Kartu Kredit/Debit',
    provider: 'midtrans',
    type: 'card',
    icon: '💳',
    description: 'Visa, Mastercard, JCB',
    processingTime: 'Instan',
    fee: 2.9,
    minAmount: 10000,
    maxAmount: 100000000,
    enabled: false, // Disabled for demo
  },
];

/**
 * Generate unique order ID
 */
export const generateOrderId = (): string => {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substr(2, 6);
  return `RZB-${timestamp}-${random}`.toUpperCase();
};

/**
 * Generate Virtual Account number (simulation)
 */
const generateVANumber = (bankCode: string): string => {
  const prefix: Record<string, string> = {
    bni: '8808',
    bca: '7770',
    mandiri: '7020',
  };
  const bankPrefix = prefix[bankCode] || '9999';
  const randomDigits = Math.floor(Math.random() * 10000000000).toString().padStart(10, '0');
  return `${bankPrefix}${randomDigits}`;
};

/**
 * Calculate payment fee
 */
export const calculateFee = (amount: number, method: PaymentMethod): number => {
  const methodInfo = PAYMENT_METHODS.find(m => m.id === method);
  if (!methodInfo) return 0;
  return Math.ceil(amount * (methodInfo.fee / 100));
};

/**
 * Get expiry time (24 hours from now)
 */
const getExpiryTime = (): string => {
  const expiry = new Date();
  expiry.setHours(expiry.getHours() + 24);
  return expiry.toISOString();
};

/**
 * Load transactions from storage
 */
export const getTransactions = (): PaymentTransaction[] => {
  try {
    const stored = localStorage.getItem(TRANSACTIONS_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
};

/**
 * Save transaction to storage
 */
const saveTransaction = (transaction: PaymentTransaction): void => {
  const transactions = getTransactions();
  const existingIndex = transactions.findIndex(t => t.id === transaction.id);
  
  if (existingIndex >= 0) {
    transactions[existingIndex] = transaction;
  } else {
    transactions.unshift(transaction);
  }
  
  localStorage.setItem(TRANSACTIONS_KEY, JSON.stringify(transactions));
};

/**
 * Get transaction by ID
 */
export const getTransactionById = (transactionId: string): PaymentTransaction | null => {
  const transactions = getTransactions();
  return transactions.find(t => t.id === transactionId) || null;
};

/**
 * Get transaction by Order ID
 */
export const getTransactionByOrderId = (orderId: string): PaymentTransaction | null => {
  const transactions = getTransactions();
  return transactions.find(t => t.orderId === orderId) || null;
};

/**
 * Create payment - DANA E-Wallet
 * Simulates Xendit DANA payment flow
 */
const createDANAPayment = async (request: PaymentRequest): Promise<PaymentResponse> => {
  // Simulate API call delay
  await new Promise(resolve => setTimeout(resolve, 1500));
  
  const fee = calculateFee(request.amount, 'dana');
  const totalAmount = request.amount + fee;
  const transactionId = `TXN-DANA-${Date.now()}`;
  
  // In production, this would call Xendit API:
  // POST https://api.xendit.co/ewallets/charges
  
  const response: PaymentResponse = {
    success: true,
    transactionId,
    orderId: request.orderId,
    status: 'pending',
    paymentMethod: 'dana',
    amount: request.amount,
    fee,
    totalAmount,
    currency: 'IDR',
    // Simulated DANA deep link
    paymentUrl: `https://link.dana.id/pay?orderId=${request.orderId}&amount=${totalAmount}`,
    deepLinkUrl: `dana://pay?orderId=${request.orderId}&amount=${totalAmount}`,
    expiryTime: getExpiryTime(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  
  // Save transaction
  const transaction: PaymentTransaction = {
    id: transactionId,
    orderId: request.orderId,
    userId: request.metadata?.userId || 'guest',
    amount: request.amount,
    fee,
    totalAmount,
    currency: 'IDR',
    status: 'pending',
    paymentMethod: 'dana',
    provider: 'xendit',
    description: request.description,
    paymentUrl: response.paymentUrl,
    expiryTime: response.expiryTime!,
    createdAt: response.createdAt,
    updatedAt: response.updatedAt,
  };
  saveTransaction(transaction);
  
  return response;
};

/**
 * Create payment - BNI Virtual Account
 * Simulates Midtrans VA payment flow
 */
const createBNIVAPayment = async (request: PaymentRequest): Promise<PaymentResponse> => {
  // Simulate API call delay
  await new Promise(resolve => setTimeout(resolve, 1500));
  
  const fee = calculateFee(request.amount, 'bni_va');
  const totalAmount = request.amount + fee;
  const transactionId = `TXN-BNI-${Date.now()}`;
  const vaNumber = generateVANumber('bni');
  
  // In production, this would call Midtrans API:
  // POST https://api.midtrans.com/v2/charge
  
  const response: PaymentResponse = {
    success: true,
    transactionId,
    orderId: request.orderId,
    status: 'pending',
    paymentMethod: 'bni_va',
    amount: request.amount,
    fee,
    totalAmount,
    currency: 'IDR',
    vaNumber,
    bankCode: 'BNI',
    expiryTime: getExpiryTime(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  
  // Save transaction
  const transaction: PaymentTransaction = {
    id: transactionId,
    orderId: request.orderId,
    userId: request.metadata?.userId || 'guest',
    amount: request.amount,
    fee,
    totalAmount,
    currency: 'IDR',
    status: 'pending',
    paymentMethod: 'bni_va',
    provider: 'midtrans',
    description: request.description,
    vaNumber,
    expiryTime: response.expiryTime!,
    createdAt: response.createdAt,
    updatedAt: response.updatedAt,
  };
  saveTransaction(transaction);
  
  return response;
};

/**
 * Create payment - Generic handler
 */
export const createPayment = async (request: PaymentRequest): Promise<PaymentResponse> => {
  // Validate request
  if (!request.orderId || !request.amount || !request.paymentMethod) {
    return {
      success: false,
      transactionId: '',
      orderId: request.orderId,
      status: 'failed',
      paymentMethod: request.paymentMethod,
      amount: request.amount,
      fee: 0,
      totalAmount: request.amount,
      currency: 'IDR',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      errorCode: 'INVALID_REQUEST',
      errorMessage: 'Missing required fields',
    };
  }
  
  // Route to specific payment method handler
  switch (request.paymentMethod) {
    case 'dana':
      return createDANAPayment(request);
    case 'bni_va':
      return createBNIVAPayment(request);
    case 'gopay':
    case 'ovo':
      // Simulate e-wallet payment
      return createEWalletPayment(request);
    case 'bca_va':
    case 'mandiri_va':
      return createVAPayment(request);
    default:
      return {
        success: false,
        transactionId: '',
        orderId: request.orderId,
        status: 'failed',
        paymentMethod: request.paymentMethod,
        amount: request.amount,
        fee: 0,
        totalAmount: request.amount,
        currency: 'IDR',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        errorCode: 'UNSUPPORTED_METHOD',
        errorMessage: 'Payment method not supported',
      };
  }
};

/**
 * Generic e-wallet payment handler
 */
const createEWalletPayment = async (request: PaymentRequest): Promise<PaymentResponse> => {
  await new Promise(resolve => setTimeout(resolve, 1500));
  
  const fee = calculateFee(request.amount, request.paymentMethod);
  const totalAmount = request.amount + fee;
  const transactionId = `TXN-${request.paymentMethod.toUpperCase()}-${Date.now()}`;
  
  const response: PaymentResponse = {
    success: true,
    transactionId,
    orderId: request.orderId,
    status: 'pending',
    paymentMethod: request.paymentMethod,
    amount: request.amount,
    fee,
    totalAmount,
    currency: 'IDR',
    paymentUrl: `https://pay.example.com/${request.paymentMethod}?order=${request.orderId}`,
    expiryTime: getExpiryTime(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  
  const transaction: PaymentTransaction = {
    id: transactionId,
    orderId: request.orderId,
    userId: request.metadata?.userId || 'guest',
    amount: request.amount,
    fee,
    totalAmount,
    currency: 'IDR',
    status: 'pending',
    paymentMethod: request.paymentMethod,
    provider: request.paymentMethod === 'gopay' ? 'midtrans' : 'xendit',
    description: request.description,
    paymentUrl: response.paymentUrl,
    expiryTime: response.expiryTime!,
    createdAt: response.createdAt,
    updatedAt: response.updatedAt,
  };
  saveTransaction(transaction);
  
  return response;
};

/**
 * Generic VA payment handler
 */
const createVAPayment = async (request: PaymentRequest): Promise<PaymentResponse> => {
  await new Promise(resolve => setTimeout(resolve, 1500));
  
  const bankCode = request.paymentMethod.replace('_va', '');
  const fee = calculateFee(request.amount, request.paymentMethod);
  const totalAmount = request.amount + fee;
  const transactionId = `TXN-${bankCode.toUpperCase()}-${Date.now()}`;
  const vaNumber = generateVANumber(bankCode);
  
  const response: PaymentResponse = {
    success: true,
    transactionId,
    orderId: request.orderId,
    status: 'pending',
    paymentMethod: request.paymentMethod,
    amount: request.amount,
    fee,
    totalAmount,
    currency: 'IDR',
    vaNumber,
    bankCode: bankCode.toUpperCase(),
    expiryTime: getExpiryTime(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  
  const transaction: PaymentTransaction = {
    id: transactionId,
    orderId: request.orderId,
    userId: request.metadata?.userId || 'guest',
    amount: request.amount,
    fee,
    totalAmount,
    currency: 'IDR',
    status: 'pending',
    paymentMethod: request.paymentMethod,
    provider: 'midtrans',
    description: request.description,
    vaNumber,
    expiryTime: response.expiryTime!,
    createdAt: response.createdAt,
    updatedAt: response.updatedAt,
  };
  saveTransaction(transaction);
  
  return response;
};

/**
 * Check payment status
 * In production, this would poll the payment provider API
 */
export const checkPaymentStatus = async (transactionId: string): Promise<PaymentTransaction | null> => {
  await new Promise(resolve => setTimeout(resolve, 500));
  return getTransactionById(transactionId);
};

/**
 * Simulate payment completion (for demo)
 */
export const simulatePaymentSuccess = async (transactionId: string): Promise<boolean> => {
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  const transaction = getTransactionById(transactionId);
  if (!transaction) return false;
  
  transaction.status = 'success';
  transaction.paidAt = new Date().toISOString();
  transaction.updatedAt = new Date().toISOString();
  saveTransaction(transaction);
  
  return true;
};

/**
 * Cancel payment
 */
export const cancelPayment = async (transactionId: string): Promise<boolean> => {
  const transaction = getTransactionById(transactionId);
  if (!transaction || transaction.status !== 'pending') return false;
  
  transaction.status = 'cancelled';
  transaction.updatedAt = new Date().toISOString();
  saveTransaction(transaction);
  
  return true;
};

/**
 * Format currency to Indonesian Rupiah
 */
export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

/**
 * Get user's payment history
 */
export const getUserPaymentHistory = (userId: string): PaymentTransaction[] => {
  const transactions = getTransactions();
  return transactions.filter(t => t.userId === userId);
};

export default {
  PAYMENT_METHODS,
  generateOrderId,
  calculateFee,
  createPayment,
  checkPaymentStatus,
  simulatePaymentSuccess,
  cancelPayment,
  formatCurrency,
  getTransactions,
  getTransactionById,
  getUserPaymentHistory,
};
