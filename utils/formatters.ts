/**
 * Utility Functions - Formatters
 * Common formatting functions for currency, numbers, dates, etc.
 */

/**
 * Format number as Indonesian Rupiah
 * @param value - Number to format
 * @param showSymbol - Whether to show 'Rp' prefix (default: true)
 */
export const formatRupiah = (value: number, showSymbol = true): string => {
  const formatted = new Intl.NumberFormat('id-ID').format(Math.abs(value));
  const sign = value < 0 ? '-' : '';
  return showSymbol ? `${sign}Rp${formatted}` : `${sign}${formatted}`;
};

/**
 * Format number with K/M/B/T suffix for large numbers
 * @param value - Number to format
 */
export const formatCompact = (value: number): string => {
  const absValue = Math.abs(value);
  const sign = value < 0 ? '-' : '';
  
  if (absValue >= 1_000_000_000_000) {
    return `${sign}${(absValue / 1_000_000_000_000).toFixed(1)}T`;
  }
  if (absValue >= 1_000_000_000) {
    return `${sign}${(absValue / 1_000_000_000).toFixed(1)}B`;
  }
  if (absValue >= 1_000_000) {
    return `${sign}${(absValue / 1_000_000).toFixed(1)}M`;
  }
  if (absValue >= 1_000) {
    return `${sign}${(absValue / 1_000).toFixed(1)}K`;
  }
  return `${sign}${absValue}`;
};

/**
 * Format percentage with sign
 * @param value - Percentage value
 * @param decimals - Number of decimal places (default: 2)
 */
export const formatPercent = (value: number, decimals = 2): string => {
  const sign = value > 0 ? '+' : '';
  return `${sign}${value.toFixed(decimals)}%`;
};

/**
 * Format price change
 */
export const formatPriceChange = (change: number): string => {
  const sign = change > 0 ? '+' : '';
  return `${sign}${formatRupiah(change, false)}`;
};

/**
 * Format volume number
 */
export const formatVolume = (volume: number): string => {
  if (volume >= 1_000_000_000) {
    return `${(volume / 1_000_000_000).toFixed(2)}B`;
  }
  if (volume >= 1_000_000) {
    return `${(volume / 1_000_000).toFixed(2)}M`;
  }
  if (volume >= 1_000) {
    return `${(volume / 1_000).toFixed(1)}K`;
  }
  return volume.toString();
};

/**
 * Format date to Indonesian locale
 */
export const formatDate = (date: Date | string | number): string => {
  const d = new Date(date);
  return d.toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
};

/**
 * Format datetime to Indonesian locale
 */
export const formatDateTime = (date: Date | string | number): string => {
  const d = new Date(date);
  return d.toLocaleString('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

/**
 * Format time only
 */
export const formatTime = (date: Date | string | number): string => {
  const d = new Date(date);
  return d.toLocaleTimeString('id-ID', {
    hour: '2-digit',
    minute: '2-digit',
  });
};

/**
 * Format relative time (e.g., "2 jam lalu")
 */
export const formatRelativeTime = (date: Date | string | number): string => {
  const d = new Date(date);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);
  
  if (diffSec < 60) return 'Baru saja';
  if (diffMin < 60) return `${diffMin} menit lalu`;
  if (diffHours < 24) return `${diffHours} jam lalu`;
  if (diffDays < 7) return `${diffDays} hari lalu`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} minggu lalu`;
  return formatDate(d);
};

/**
 * Parse price input string (handles "10.000" or "10000" format)
 */
export const parsePriceInput = (input: string): number => {
  // Remove all non-numeric characters except comma and dot
  const cleaned = input.replace(/[^\d,.]/g, '');
  // Replace comma with dot for decimal
  const normalized = cleaned.replace(/\./g, '').replace(',', '.');
  return parseFloat(normalized) || 0;
};

/**
 * Format lots to shares
 */
export const lotsToShares = (lots: number): number => lots * 100;

/**
 * Format shares to lots
 */
export const sharesToLots = (shares: number): number => Math.floor(shares / 100);

/**
 * Calculate profit/loss color class
 */
export const getProfitLossColor = (value: number): string => {
  if (value > 0) return 'text-emerald-400';
  if (value < 0) return 'text-red-400';
  return 'text-slate-400';
};

/**
 * Calculate profit/loss background class
 */
export const getProfitLossBg = (value: number): string => {
  if (value > 0) return 'bg-emerald-500/20';
  if (value < 0) return 'bg-red-500/20';
  return 'bg-slate-700/50';
};

export default {
  formatRupiah,
  formatCompact,
  formatPercent,
  formatPriceChange,
  formatVolume,
  formatDate,
  formatDateTime,
  formatTime,
  formatRelativeTime,
  parsePriceInput,
  lotsToShares,
  sharesToLots,
  getProfitLossColor,
  getProfitLossBg,
};
