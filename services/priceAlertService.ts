/**
 * Price Alert Service
 * Manages price alerts with localStorage persistence and notifications
 */

export interface PriceAlert {
  id: string;
  symbol: string;
  targetPrice: number;
  condition: 'above' | 'below';
  createdAt: number;
  triggered: boolean;
  triggeredAt?: number;
  note?: string;
}

const ALERTS_STORAGE_KEY = 'rizbot_price_alerts';
const NOTIFICATION_SOUND_URL = 'https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3';

// Load alerts from localStorage
export const loadAlerts = (): PriceAlert[] => {
  try {
    const stored = localStorage.getItem(ALERTS_STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (e) {
    console.error('Failed to load alerts:', e);
  }
  return [];
};

// Save alerts to localStorage
export const saveAlerts = (alerts: PriceAlert[]) => {
  try {
    localStorage.setItem(ALERTS_STORAGE_KEY, JSON.stringify(alerts));
  } catch (e) {
    console.error('Failed to save alerts:', e);
  }
};

// Generate unique ID
const generateId = (): string => {
  return `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

// Create new alert
export const createAlert = (
  symbol: string,
  targetPrice: number,
  condition: 'above' | 'below',
  note?: string
): PriceAlert => {
  const alert: PriceAlert = {
    id: generateId(),
    symbol,
    targetPrice,
    condition,
    createdAt: Date.now(),
    triggered: false,
    note,
  };

  const alerts = loadAlerts();
  alerts.push(alert);
  saveAlerts(alerts);

  return alert;
};

// Delete alert
export const deleteAlert = (alertId: string) => {
  const alerts = loadAlerts();
  const filtered = alerts.filter(a => a.id !== alertId);
  saveAlerts(filtered);
};

// Get alerts for a specific symbol
export const getAlertsForSymbol = (symbol: string): PriceAlert[] => {
  return loadAlerts().filter(a => a.symbol === symbol && !a.triggered);
};

// Get all active (non-triggered) alerts
export const getActiveAlerts = (): PriceAlert[] => {
  return loadAlerts().filter(a => !a.triggered);
};

// Get triggered alerts history
export const getTriggeredAlerts = (): PriceAlert[] => {
  return loadAlerts().filter(a => a.triggered).sort((a, b) => (b.triggeredAt || 0) - (a.triggeredAt || 0));
};

// Check if price triggers any alerts
export const checkAlerts = (
  symbol: string,
  currentPrice: number
): PriceAlert[] => {
  const alerts = loadAlerts();
  const triggeredAlerts: PriceAlert[] = [];

  const updatedAlerts = alerts.map(alert => {
    if (alert.triggered || alert.symbol !== symbol) {
      return alert;
    }

    let shouldTrigger = false;

    if (alert.condition === 'above' && currentPrice >= alert.targetPrice) {
      shouldTrigger = true;
    } else if (alert.condition === 'below' && currentPrice <= alert.targetPrice) {
      shouldTrigger = true;
    }

    if (shouldTrigger) {
      const triggered = {
        ...alert,
        triggered: true,
        triggeredAt: Date.now(),
      };
      triggeredAlerts.push(triggered);
      return triggered;
    }

    return alert;
  });

  if (triggeredAlerts.length > 0) {
    saveAlerts(updatedAlerts);
  }

  return triggeredAlerts;
};

// Play notification sound
export const playAlertSound = () => {
  try {
    const audio = new Audio(NOTIFICATION_SOUND_URL);
    audio.volume = 0.5;
    audio.play().catch(e => console.warn('Could not play alert sound:', e));
  } catch (e) {
    console.warn('Audio not supported:', e);
  }
};

// Request notification permission
export const requestNotificationPermission = async (): Promise<boolean> => {
  if (!('Notification' in window)) {
    console.warn('Browser does not support notifications');
    return false;
  }

  if (Notification.permission === 'granted') {
    return true;
  }

  if (Notification.permission !== 'denied') {
    const permission = await Notification.requestPermission();
    return permission === 'granted';
  }

  return false;
};

// Show browser notification
export const showNotification = (alert: PriceAlert, currentPrice: number) => {
  if (Notification.permission !== 'granted') {
    return;
  }

  const conditionText = alert.condition === 'above' ? 'naik di atas' : 'turun di bawah';
  const title = `🔔 Alert: ${alert.symbol}`;
  const body = `Harga ${alert.symbol} sudah ${conditionText} Rp ${alert.targetPrice.toLocaleString()}!\nHarga saat ini: Rp ${currentPrice.toLocaleString()}`;

  try {
    const notification = new Notification(title, {
      body,
      icon: '/favicon.ico',
      badge: '/favicon.ico',
      tag: alert.id,
      requireInteraction: true,
    });

    notification.onclick = () => {
      window.focus();
      notification.close();
    };

    // Auto close after 10 seconds
    setTimeout(() => notification.close(), 10000);
  } catch (e) {
    console.warn('Failed to show notification:', e);
  }
};

// Trigger full alert (sound + notification)
export const triggerAlertNotification = (alert: PriceAlert, currentPrice: number) => {
  playAlertSound();
  showNotification(alert, currentPrice);
};

// Clear all triggered alerts
export const clearTriggeredAlerts = () => {
  const alerts = loadAlerts();
  const active = alerts.filter(a => !a.triggered);
  saveAlerts(active);
};

// Format alert for display
export const formatAlertMessage = (alert: PriceAlert): string => {
  const condition = alert.condition === 'above' ? '≥' : '≤';
  return `${alert.symbol} ${condition} Rp ${alert.targetPrice.toLocaleString()}`;
};

export default {
  loadAlerts,
  saveAlerts,
  createAlert,
  deleteAlert,
  getAlertsForSymbol,
  getActiveAlerts,
  getTriggeredAlerts,
  checkAlerts,
  playAlertSound,
  requestNotificationPermission,
  showNotification,
  triggerAlertNotification,
  clearTriggeredAlerts,
  formatAlertMessage,
};
