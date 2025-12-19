/**
 * Admin Payment Configuration
 * Konfigurasi nomor rekening/akun pembayaran yang dikelola admin
 * 
 * Cara kerja:
 * 1. Admin mengatur nomor rekening DANA, GoPay, dan BNI melalui AdminPaymentSettings
 * 2. Nomor-nomor ini akan ditampilkan ke user saat pembayaran
 * 3. User transfer ke nomor tersebut, lalu konfirmasi pembayaran
 * 4. Admin verifikasi pembayaran secara manual atau otomatis via webhook
 */

export interface PaymentAccountConfig {
  // E-Wallet Accounts
  dana: {
    enabled: boolean;
    phoneNumber: string;      // Nomor HP terdaftar DANA
    accountName: string;      // Nama pemilik akun
    qrCodeUrl?: string;       // URL gambar QR Code (opsional)
  };
  gopay: {
    enabled: boolean;
    phoneNumber: string;      // Nomor HP terdaftar GoPay
    accountName: string;      // Nama pemilik akun
    qrCodeUrl?: string;       // URL gambar QR Code (opsional)
  };
  ovo: {
    enabled: boolean;
    phoneNumber: string;
    accountName: string;
    qrCodeUrl?: string;
  };
  // Bank Virtual Accounts
  bni: {
    enabled: boolean;
    accountNumber: string;    // Nomor rekening BNI
    accountName: string;      // Nama pemilik rekening
    branch?: string;          // Cabang (opsional)
  };
  bca: {
    enabled: boolean;
    accountNumber: string;
    accountName: string;
    branch?: string;
  };
  mandiri: {
    enabled: boolean;
    accountNumber: string;
    accountName: string;
    branch?: string;
  };
}

// Storage key
const PAYMENT_CONFIG_KEY = 'rizbot_admin_payment_config';

// Default configuration (Admin harus mengisinya)
const DEFAULT_CONFIG: PaymentAccountConfig = {
  dana: {
    enabled: true,
    phoneNumber: '081234567890',  // Ganti dengan nomor admin
    accountName: 'RIZBOT IDX',
    qrCodeUrl: '',
  },
  gopay: {
    enabled: true,
    phoneNumber: '081234567890',  // Ganti dengan nomor admin
    accountName: 'RIZBOT IDX',
    qrCodeUrl: '',
  },
  ovo: {
    enabled: true,
    phoneNumber: '081234567890',
    accountName: 'RIZBOT IDX',
    qrCodeUrl: '',
  },
  bni: {
    enabled: true,
    accountNumber: '1234567890',  // Ganti dengan rekening admin
    accountName: 'RIZBOT IDX',
    branch: 'KCP Jakarta',
  },
  bca: {
    enabled: true,
    accountNumber: '1234567890',
    accountName: 'RIZBOT IDX',
    branch: 'KCP Jakarta',
  },
  mandiri: {
    enabled: true,
    accountNumber: '1234567890',
    accountName: 'RIZBOT IDX',
    branch: 'KC Jakarta',
  },
};

/**
 * Get payment configuration
 */
export const getPaymentConfig = (): PaymentAccountConfig => {
  try {
    const stored = localStorage.getItem(PAYMENT_CONFIG_KEY);
    if (stored) {
      return { ...DEFAULT_CONFIG, ...JSON.parse(stored) };
    }
    return DEFAULT_CONFIG;
  } catch {
    return DEFAULT_CONFIG;
  }
};

/**
 * Save payment configuration (Admin only)
 */
export const savePaymentConfig = (config: Partial<PaymentAccountConfig>): boolean => {
  try {
    const current = getPaymentConfig();
    const updated = { ...current, ...config };
    localStorage.setItem(PAYMENT_CONFIG_KEY, JSON.stringify(updated));
    return true;
  } catch {
    return false;
  }
};

/**
 * Update specific payment method config
 */
export const updatePaymentMethod = <K extends keyof PaymentAccountConfig>(
  method: K,
  config: PaymentAccountConfig[K]
): boolean => {
  try {
    const current = getPaymentConfig();
    current[method] = config;
    localStorage.setItem(PAYMENT_CONFIG_KEY, JSON.stringify(current));
    return true;
  } catch {
    return false;
  }
};

/**
 * Get formatted display for payment
 */
export const getPaymentDisplay = (method: 'dana' | 'gopay' | 'ovo' | 'bni' | 'bca' | 'mandiri') => {
  const config = getPaymentConfig();
  
  switch (method) {
    case 'dana':
    case 'gopay':
    case 'ovo':
      return {
        enabled: config[method].enabled,
        number: config[method].phoneNumber,
        name: config[method].accountName,
        qrCode: config[method].qrCodeUrl,
        type: 'ewallet' as const,
      };
    case 'bni':
    case 'bca':
    case 'mandiri':
      return {
        enabled: config[method].enabled,
        number: config[method].accountNumber,
        name: config[method].accountName,
        branch: config[method].branch,
        type: 'bank' as const,
      };
  }
};

/**
 * Format phone number for display
 */
export const formatPhoneNumber = (phone: string): string => {
  // Format: 0812-3456-7890
  const cleaned = phone.replace(/\D/g, '');
  if (cleaned.length === 12) {
    return `${cleaned.slice(0, 4)}-${cleaned.slice(4, 8)}-${cleaned.slice(8)}`;
  } else if (cleaned.length === 11) {
    return `${cleaned.slice(0, 4)}-${cleaned.slice(4, 7)}-${cleaned.slice(7)}`;
  }
  return phone;
};

/**
 * Format bank account for display
 */
export const formatAccountNumber = (account: string): string => {
  // Format: 1234-5678-90
  const cleaned = account.replace(/\D/g, '');
  if (cleaned.length >= 10) {
    return cleaned.replace(/(.{4})/g, '$1-').slice(0, -1);
  }
  return account;
};

export default {
  getPaymentConfig,
  savePaymentConfig,
  updatePaymentMethod,
  getPaymentDisplay,
  formatPhoneNumber,
  formatAccountNumber,
};
