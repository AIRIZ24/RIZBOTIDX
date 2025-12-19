/**
 * Payment Modal Component
 * Handles payment flow with DANA and BNI Virtual Account
 */

import React, { useState, useEffect } from 'react';
import {
  PaymentMethod,
  PaymentResponse,
  PaymentTransaction,
  PAYMENT_METHODS,
  generateOrderId,
  calculateFee,
  createPayment,
  simulatePaymentSuccess,
  formatCurrency,
  checkPaymentStatus,
} from '../services/paymentService';
import { SubscriptionTier, SUBSCRIPTION_LIMITS, upgradeSubscription, getSession } from '../services/authService';
import { getPaymentConfig, formatPhoneNumber, formatAccountNumber } from '../services/adminPaymentConfig';

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedTier: SubscriptionTier;
  onPaymentSuccess: (tier: SubscriptionTier) => void;
}

type PaymentStep = 'method' | 'confirm' | 'process' | 'instruction' | 'success' | 'failed';

const PaymentModal: React.FC<PaymentModalProps> = ({
  isOpen,
  onClose,
  selectedTier,
  onPaymentSuccess,
}) => {
  const [step, setStep] = useState<PaymentStep>('method');
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentResponse, setPaymentResponse] = useState<PaymentResponse | null>(null);
  const [countdown, setCountdown] = useState(300); // 5 minutes for demo
  const [error, setError] = useState<string | null>(null);

  const user = getSession();
  const tierInfo = SUBSCRIPTION_LIMITS[selectedTier];
  const baseAmount = tierInfo.price;
  const fee = selectedMethod ? calculateFee(baseAmount, selectedMethod) : 0;
  const totalAmount = baseAmount + fee;

  // Reset when modal opens
  useEffect(() => {
    if (isOpen) {
      setStep('method');
      setSelectedMethod(null);
      setPaymentResponse(null);
      setError(null);
      setCountdown(300);
    }
  }, [isOpen]);

  // Countdown timer for payment
  useEffect(() => {
    if (step === 'instruction' && countdown > 0) {
      const timer = setInterval(() => {
        setCountdown(prev => prev - 1);
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [step, countdown]);

  const formatCountdown = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleSelectMethod = (method: PaymentMethod) => {
    setSelectedMethod(method);
    setStep('confirm');
  };

  const handleConfirmPayment = async () => {
    if (!selectedMethod || !user) return;

    setIsProcessing(true);
    setError(null);

    try {
      const response = await createPayment({
        orderId: generateOrderId(),
        amount: baseAmount,
        currency: 'IDR',
        description: `Upgrade ke ${tierInfo.name} Plan`,
        customerName: user.name,
        customerEmail: user.email,
        paymentMethod: selectedMethod,
        metadata: {
          userId: user.id,
          tier: selectedTier,
        },
      });

      if (response.success) {
        setPaymentResponse(response);
        setStep('instruction');
      } else {
        setError(response.errorMessage || 'Gagal membuat pembayaran');
        setStep('failed');
      }
    } catch (err) {
      setError('Terjadi kesalahan. Silakan coba lagi.');
      setStep('failed');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSimulatePayment = async () => {
    if (!paymentResponse) return;

    setStep('process');
    setIsProcessing(true);

    try {
      const success = await simulatePaymentSuccess(paymentResponse.transactionId);
      
      if (success) {
        // Upgrade subscription
        const result = upgradeSubscription(selectedTier);
        if (result.success) {
          setStep('success');
          setTimeout(() => {
            onPaymentSuccess(selectedTier);
          }, 2000);
        }
      } else {
        setStep('failed');
        setError('Simulasi pembayaran gagal');
      }
    } catch (err) {
      setStep('failed');
      setError('Terjadi kesalahan');
    } finally {
      setIsProcessing(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    // Could add a toast notification here
  };

  if (!isOpen) return null;

  const methodInfo = selectedMethod ? PAYMENT_METHODS.find(m => m.id === selectedMethod) : null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={step === 'instruction' ? undefined : onClose}
      />
      
      {/* Modal */}
      <div className="relative bg-[#0f1629] rounded-2xl border border-slate-700/50 shadow-2xl w-full max-w-lg overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-700/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-xl flex items-center justify-center">
              <span className="material-icons-round text-white">payment</span>
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">
                {step === 'method' && 'Pilih Metode Pembayaran'}
                {step === 'confirm' && 'Konfirmasi Pembayaran'}
                {step === 'process' && 'Memproses...'}
                {step === 'instruction' && 'Instruksi Pembayaran'}
                {step === 'success' && 'Pembayaran Berhasil!'}
                {step === 'failed' && 'Pembayaran Gagal'}
              </h2>
              <p className="text-sm text-slate-400">Upgrade ke {tierInfo.name}</p>
            </div>
          </div>
          {step !== 'process' && (
            <button
              onClick={onClose}
              className="p-2 hover:bg-slate-700/50 rounded-lg transition-colors"
            >
              <span className="material-icons-round text-slate-400">close</span>
            </button>
          )}
        </div>

        {/* Content */}
        <div className="p-5 max-h-[60vh] overflow-y-auto">
          {/* Step: Select Payment Method */}
          {step === 'method' && (
            <div className="space-y-4">
              {/* E-Wallet Section */}
              <div>
                <p className="text-xs text-slate-500 uppercase tracking-wider mb-3">E-Wallet</p>
                <div className="space-y-2">
                  {/* DANA */}
                  <button
                    onClick={() => handleSelectMethod('dana')}
                    className="w-full p-4 bg-slate-800/50 hover:bg-slate-800 border border-slate-700/50 hover:border-blue-500/50 rounded-xl transition-all text-left group"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-[#108ee9] rounded-xl flex items-center justify-center">
                          <span className="text-white font-bold text-sm">DANA</span>
                        </div>
                        <div>
                          <p className="font-semibold text-white group-hover:text-blue-400 transition-colors">DANA</p>
                          <p className="text-xs text-slate-500">Biaya 1.5% • Instan</p>
                        </div>
                      </div>
                      <span className="material-icons-round text-slate-500 group-hover:text-blue-400 transition-colors">chevron_right</span>
                    </div>
                  </button>

                  {/* GoPay */}
                  <button
                    onClick={() => handleSelectMethod('gopay')}
                    className="w-full p-4 bg-slate-800/50 hover:bg-slate-800 border border-slate-700/50 hover:border-green-500/50 rounded-xl transition-all text-left group"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center">
                          <span className="text-white font-bold text-xs">GoPay</span>
                        </div>
                        <div>
                          <p className="font-semibold text-white group-hover:text-green-400 transition-colors">GoPay</p>
                          <p className="text-xs text-slate-500">Biaya 2% • Instan</p>
                        </div>
                      </div>
                      <span className="material-icons-round text-slate-500 group-hover:text-green-400 transition-colors">chevron_right</span>
                    </div>
                  </button>

                  {/* OVO */}
                  <button
                    onClick={() => handleSelectMethod('ovo')}
                    className="w-full p-4 bg-slate-800/50 hover:bg-slate-800 border border-slate-700/50 hover:border-purple-500/50 rounded-xl transition-all text-left group"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center">
                          <span className="text-white font-bold text-sm">OVO</span>
                        </div>
                        <div>
                          <p className="font-semibold text-white group-hover:text-purple-400 transition-colors">OVO</p>
                          <p className="text-xs text-slate-500">Biaya 2% • Instan</p>
                        </div>
                      </div>
                      <span className="material-icons-round text-slate-500 group-hover:text-purple-400 transition-colors">chevron_right</span>
                    </div>
                  </button>
                </div>
              </div>

              {/* Virtual Account Section */}
              <div>
                <p className="text-xs text-slate-500 uppercase tracking-wider mb-3">Virtual Account (Tanpa Biaya)</p>
                <div className="space-y-2">
                  {/* BNI */}
                  <button
                    onClick={() => handleSelectMethod('bni_va')}
                    className="w-full p-4 bg-slate-800/50 hover:bg-slate-800 border border-slate-700/50 hover:border-orange-500/50 rounded-xl transition-all text-left group"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl flex items-center justify-center">
                          <span className="text-white font-bold text-sm">BNI</span>
                        </div>
                        <div>
                          <p className="font-semibold text-white group-hover:text-orange-400 transition-colors">BNI Virtual Account</p>
                          <p className="text-xs text-slate-500">ATM / Mobile Banking • 1-5 menit</p>
                        </div>
                      </div>
                      <span className="material-icons-round text-slate-500 group-hover:text-orange-400 transition-colors">chevron_right</span>
                    </div>
                  </button>

                  {/* BCA */}
                  <button
                    onClick={() => handleSelectMethod('bca_va')}
                    className="w-full p-4 bg-slate-800/50 hover:bg-slate-800 border border-slate-700/50 hover:border-blue-500/50 rounded-xl transition-all text-left group"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl flex items-center justify-center">
                          <span className="text-white font-bold text-sm">BCA</span>
                        </div>
                        <div>
                          <p className="font-semibold text-white group-hover:text-blue-400 transition-colors">BCA Virtual Account</p>
                          <p className="text-xs text-slate-500">ATM / m-BCA • 1-5 menit</p>
                        </div>
                      </div>
                      <span className="material-icons-round text-slate-500 group-hover:text-blue-400 transition-colors">chevron_right</span>
                    </div>
                  </button>

                  {/* Mandiri */}
                  <button
                    onClick={() => handleSelectMethod('mandiri_va')}
                    className="w-full p-4 bg-slate-800/50 hover:bg-slate-800 border border-slate-700/50 hover:border-yellow-500/50 rounded-xl transition-all text-left group"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-xl flex items-center justify-center">
                          <span className="text-white font-bold text-xs">MDR</span>
                        </div>
                        <div>
                          <p className="font-semibold text-white group-hover:text-yellow-400 transition-colors">Mandiri Virtual Account</p>
                          <p className="text-xs text-slate-500">ATM / Livin' • 1-5 menit</p>
                        </div>
                      </div>
                      <span className="material-icons-round text-slate-500 group-hover:text-yellow-400 transition-colors">chevron_right</span>
                    </div>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Step: Confirm Payment */}
          {step === 'confirm' && methodInfo && (
            <div className="space-y-5">
              {/* Selected method */}
              <div className="flex items-center gap-3 p-3 bg-slate-800/50 rounded-xl">
                <span className="text-2xl">{methodInfo.icon}</span>
                <div>
                  <p className="font-medium text-white">{methodInfo.name}</p>
                  <p className="text-xs text-slate-400">{methodInfo.description}</p>
                </div>
              </div>

              {/* Order summary */}
              <div className="space-y-3 p-4 bg-slate-900/50 rounded-xl border border-slate-700/50">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400">Paket</span>
                  <span className="text-white font-medium">{tierInfo.name} Plan</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400">Durasi</span>
                  <span className="text-white">1 Bulan</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400">Harga</span>
                  <span className="text-white">{formatCurrency(baseAmount)}</span>
                </div>
                {fee > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-400">Biaya ({methodInfo.fee}%)</span>
                    <span className="text-white">{formatCurrency(fee)}</span>
                  </div>
                )}
                <div className="pt-3 border-t border-slate-700/50 flex justify-between">
                  <span className="font-semibold text-white">Total</span>
                  <span className="text-xl font-bold text-emerald-400">{formatCurrency(totalAmount)}</span>
                </div>
              </div>

              {/* Buttons */}
              <div className="flex gap-3">
                <button
                  onClick={() => setStep('method')}
                  className="flex-1 px-4 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl transition-colors"
                >
                  Kembali
                </button>
                <button
                  onClick={handleConfirmPayment}
                  disabled={isProcessing}
                  className="flex-1 px-4 py-3 bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-semibold rounded-xl hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isProcessing ? (
                    <>
                      <span className="material-icons-round animate-spin text-lg">sync</span>
                      Memproses...
                    </>
                  ) : (
                    <>
                      <span className="material-icons-round text-lg">lock</span>
                      Bayar Sekarang
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* Step: Payment Instructions */}
          {step === 'instruction' && paymentResponse && (() => {
            const paymentConfig = getPaymentConfig();
            const methodKey = paymentResponse.paymentMethod.replace('_va', '') as 'dana' | 'gopay' | 'ovo' | 'bni' | 'bca' | 'mandiri';
            const isEwallet = ['dana', 'gopay', 'ovo'].includes(methodKey);
            const accountInfo = isEwallet 
              ? paymentConfig[methodKey as 'dana' | 'gopay' | 'ovo']
              : paymentConfig[methodKey as 'bni' | 'bca' | 'mandiri'];
            
            return (
            <div className="space-y-5">
              {/* Countdown */}
              <div className="text-center p-4 bg-amber-500/10 border border-amber-500/30 rounded-xl">
                <p className="text-sm text-amber-400 mb-1">Selesaikan pembayaran dalam</p>
                <p className="text-3xl font-mono font-bold text-amber-400">{formatCountdown(countdown)}</p>
              </div>

              {/* Amount to pay */}
              <div className="text-center p-4 bg-slate-800/50 rounded-xl">
                <p className="text-sm text-slate-400 mb-1">Total Pembayaran</p>
                <p className="text-3xl font-bold text-white">{formatCurrency(paymentResponse.totalAmount)}</p>
                <p className="text-xs text-amber-400 mt-1">* Pastikan transfer sesuai nominal</p>
              </div>

              {/* Payment Account Info - E-Wallet */}
              {isEwallet && 'phoneNumber' in accountInfo && (
                <div className="p-4 bg-slate-900/50 rounded-xl border border-slate-700/50">
                  <p className="text-sm text-slate-400 mb-2">Transfer ke Nomor {methodKey.toUpperCase()}</p>
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-2xl font-mono font-bold text-white tracking-wider">
                      {formatPhoneNumber(accountInfo.phoneNumber)}
                    </p>
                    <button
                      onClick={() => copyToClipboard(accountInfo.phoneNumber)}
                      className="p-2 hover:bg-slate-700 rounded-lg transition-colors"
                      title="Salin"
                    >
                      <span className="material-icons-round text-blue-400">content_copy</span>
                    </button>
                  </div>
                  <p className="text-sm text-slate-400">
                    a.n. <strong className="text-white">{accountInfo.accountName}</strong>
                  </p>
                </div>
              )}

              {/* Payment Account Info - Bank */}
              {!isEwallet && 'accountNumber' in accountInfo && (
                <div className="p-4 bg-slate-900/50 rounded-xl border border-slate-700/50">
                  <p className="text-sm text-slate-400 mb-2">Transfer ke Rekening {methodKey.toUpperCase()}</p>
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-2xl font-mono font-bold text-white tracking-wider">
                      {formatAccountNumber(accountInfo.accountNumber)}
                    </p>
                    <button
                      onClick={() => copyToClipboard(accountInfo.accountNumber)}
                      className="p-2 hover:bg-slate-700 rounded-lg transition-colors"
                      title="Salin"
                    >
                      <span className="material-icons-round text-blue-400">content_copy</span>
                    </button>
                  </div>
                  <p className="text-sm text-slate-400">
                    a.n. <strong className="text-white">{accountInfo.accountName}</strong>
                  </p>
                  {'branch' in accountInfo && accountInfo.branch && (
                    <p className="text-xs text-slate-500 mt-1">{accountInfo.branch}</p>
                  )}
                </div>
              )}

              {/* Instructions */}
              <div className="space-y-3">
                <p className="text-sm font-semibold text-white">Cara Pembayaran:</p>
                
                {/* BNI VA Instructions */}
                {paymentResponse.paymentMethod === 'bni_va' && (
                  <div className="space-y-2 text-sm text-slate-400">
                    <div className="flex gap-3">
                      <span className="w-6 h-6 bg-orange-500/20 text-orange-400 rounded-full flex items-center justify-center text-xs font-bold shrink-0">1</span>
                      <p>Buka aplikasi <strong className="text-white">BNI Mobile Banking</strong> atau kunjungi ATM BNI</p>
                    </div>
                    <div className="flex gap-3">
                      <span className="w-6 h-6 bg-orange-500/20 text-orange-400 rounded-full flex items-center justify-center text-xs font-bold shrink-0">2</span>
                      <p>Pilih menu <strong className="text-white">Transfer</strong> → <strong className="text-white">Sesama BNI</strong></p>
                    </div>
                    <div className="flex gap-3">
                      <span className="w-6 h-6 bg-orange-500/20 text-orange-400 rounded-full flex items-center justify-center text-xs font-bold shrink-0">3</span>
                      <p>Masukkan nomor rekening di atas dan jumlah transfer</p>
                    </div>
                    <div className="flex gap-3">
                      <span className="w-6 h-6 bg-orange-500/20 text-orange-400 rounded-full flex items-center justify-center text-xs font-bold shrink-0">4</span>
                      <p>Konfirmasi dan simpan bukti transfer</p>
                    </div>
                  </div>
                )}

                {/* BCA VA Instructions */}
                {paymentResponse.paymentMethod === 'bca_va' && (
                  <div className="space-y-2 text-sm text-slate-400">
                    <div className="flex gap-3">
                      <span className="w-6 h-6 bg-blue-500/20 text-blue-400 rounded-full flex items-center justify-center text-xs font-bold shrink-0">1</span>
                      <p>Buka aplikasi <strong className="text-white">BCA Mobile</strong> atau kunjungi ATM BCA</p>
                    </div>
                    <div className="flex gap-3">
                      <span className="w-6 h-6 bg-blue-500/20 text-blue-400 rounded-full flex items-center justify-center text-xs font-bold shrink-0">2</span>
                      <p>Pilih menu <strong className="text-white">m-Transfer</strong> → <strong className="text-white">Antar Rekening</strong></p>
                    </div>
                    <div className="flex gap-3">
                      <span className="w-6 h-6 bg-blue-500/20 text-blue-400 rounded-full flex items-center justify-center text-xs font-bold shrink-0">3</span>
                      <p>Masukkan nomor rekening di atas dan jumlah transfer</p>
                    </div>
                    <div className="flex gap-3">
                      <span className="w-6 h-6 bg-blue-500/20 text-blue-400 rounded-full flex items-center justify-center text-xs font-bold shrink-0">4</span>
                      <p>Konfirmasi dan simpan bukti transfer</p>
                    </div>
                  </div>
                )}

                {/* Mandiri VA Instructions */}
                {paymentResponse.paymentMethod === 'mandiri_va' && (
                  <div className="space-y-2 text-sm text-slate-400">
                    <div className="flex gap-3">
                      <span className="w-6 h-6 bg-yellow-500/20 text-yellow-400 rounded-full flex items-center justify-center text-xs font-bold shrink-0">1</span>
                      <p>Buka aplikasi <strong className="text-white">Livin' by Mandiri</strong> atau kunjungi ATM Mandiri</p>
                    </div>
                    <div className="flex gap-3">
                      <span className="w-6 h-6 bg-yellow-500/20 text-yellow-400 rounded-full flex items-center justify-center text-xs font-bold shrink-0">2</span>
                      <p>Pilih menu <strong className="text-white">Transfer</strong> → <strong className="text-white">Ke Rekening Mandiri</strong></p>
                    </div>
                    <div className="flex gap-3">
                      <span className="w-6 h-6 bg-yellow-500/20 text-yellow-400 rounded-full flex items-center justify-center text-xs font-bold shrink-0">3</span>
                      <p>Masukkan nomor rekening di atas dan jumlah transfer</p>
                    </div>
                    <div className="flex gap-3">
                      <span className="w-6 h-6 bg-yellow-500/20 text-yellow-400 rounded-full flex items-center justify-center text-xs font-bold shrink-0">4</span>
                      <p>Konfirmasi dan simpan bukti transfer</p>
                    </div>
                  </div>
                )}

                {/* DANA Instructions */}
                {paymentResponse.paymentMethod === 'dana' && (
                  <div className="space-y-2 text-sm text-slate-400">
                    <div className="flex gap-3">
                      <span className="w-6 h-6 bg-blue-500/20 text-blue-400 rounded-full flex items-center justify-center text-xs font-bold shrink-0">1</span>
                      <p>Buka aplikasi <strong className="text-white">DANA</strong> di HP Anda</p>
                    </div>
                    <div className="flex gap-3">
                      <span className="w-6 h-6 bg-blue-500/20 text-blue-400 rounded-full flex items-center justify-center text-xs font-bold shrink-0">2</span>
                      <p>Pilih <strong className="text-white">Kirim</strong> dan masukkan nomor di atas</p>
                    </div>
                    <div className="flex gap-3">
                      <span className="w-6 h-6 bg-blue-500/20 text-blue-400 rounded-full flex items-center justify-center text-xs font-bold shrink-0">3</span>
                      <p>Masukkan jumlah <strong className="text-white">{formatCurrency(paymentResponse.totalAmount)}</strong></p>
                    </div>
                    <div className="flex gap-3">
                      <span className="w-6 h-6 bg-blue-500/20 text-blue-400 rounded-full flex items-center justify-center text-xs font-bold shrink-0">4</span>
                      <p>Masukkan PIN dan simpan bukti transfer</p>
                    </div>
                  </div>
                )}

                {/* GoPay Instructions */}
                {paymentResponse.paymentMethod === 'gopay' && (
                  <div className="space-y-2 text-sm text-slate-400">
                    <div className="flex gap-3">
                      <span className="w-6 h-6 bg-green-500/20 text-green-400 rounded-full flex items-center justify-center text-xs font-bold shrink-0">1</span>
                      <p>Buka aplikasi <strong className="text-white">Gojek</strong> atau <strong className="text-white">GoPay</strong></p>
                    </div>
                    <div className="flex gap-3">
                      <span className="w-6 h-6 bg-green-500/20 text-green-400 rounded-full flex items-center justify-center text-xs font-bold shrink-0">2</span>
                      <p>Pilih <strong className="text-white">Bayar</strong> dan scan QR Code</p>
                    </div>
                    <div className="flex gap-3">
                      <span className="w-6 h-6 bg-green-500/20 text-green-400 rounded-full flex items-center justify-center text-xs font-bold shrink-0">3</span>
                      <p>Masukkan <strong className="text-white">PIN GoPay</strong> untuk konfirmasi</p>
                    </div>
                    <div className="flex gap-3">
                      <span className="w-6 h-6 bg-green-500/20 text-green-400 rounded-full flex items-center justify-center text-xs font-bold shrink-0">4</span>
                      <p>Pembayaran akan otomatis terverifikasi</p>
                    </div>
                  </div>
                )}

                {/* OVO Instructions */}
                {paymentResponse.paymentMethod === 'ovo' && (
                  <div className="space-y-2 text-sm text-slate-400">
                    <div className="flex gap-3">
                      <span className="w-6 h-6 bg-purple-500/20 text-purple-400 rounded-full flex items-center justify-center text-xs font-bold shrink-0">1</span>
                      <p>Buka aplikasi <strong className="text-white">OVO</strong> di HP Anda</p>
                    </div>
                    <div className="flex gap-3">
                      <span className="w-6 h-6 bg-purple-500/20 text-purple-400 rounded-full flex items-center justify-center text-xs font-bold shrink-0">2</span>
                      <p>Pilih <strong className="text-white">Scan</strong> dan scan QR Code</p>
                    </div>
                    <div className="flex gap-3">
                      <span className="w-6 h-6 bg-purple-500/20 text-purple-400 rounded-full flex items-center justify-center text-xs font-bold shrink-0">3</span>
                      <p>Masukkan <strong className="text-white">Security Code</strong> OVO</p>
                    </div>
                    <div className="flex gap-3">
                      <span className="w-6 h-6 bg-purple-500/20 text-purple-400 rounded-full flex items-center justify-center text-xs font-bold shrink-0">4</span>
                      <p>Pembayaran akan otomatis terverifikasi</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Demo: Simulate Payment Button */}
              <div className="pt-3 border-t border-slate-700/50">
                <p className="text-xs text-center text-slate-500 mb-3">
                  Setelah transfer, klik tombol di bawah untuk konfirmasi
                </p>
                <button
                  onClick={handleSimulatePayment}
                  className="w-full px-4 py-3 bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-semibold rounded-xl hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
                >
                  <span className="material-icons-round">check_circle</span>
                  Saya Sudah Transfer
                </button>
              </div>
            </div>
            );
          })()}

          {/* Step: Processing */}
          {step === 'process' && (
            <div className="py-12 text-center">
              <div className="w-20 h-20 mx-auto mb-6 relative">
                <div className="absolute inset-0 rounded-full border-4 border-slate-700"></div>
                <div className="absolute inset-0 rounded-full border-4 border-emerald-500 border-t-transparent animate-spin"></div>
              </div>
              <p className="text-lg font-semibold text-white mb-2">Memproses Pembayaran</p>
              <p className="text-sm text-slate-400">Mohon tunggu sebentar...</p>
            </div>
          )}

          {/* Step: Success */}
          {step === 'success' && (
            <div className="py-8 text-center">
              <div className="w-20 h-20 mx-auto mb-6 bg-emerald-500/20 rounded-full flex items-center justify-center">
                <span className="material-icons-round text-emerald-400 text-5xl">check_circle</span>
              </div>
              <p className="text-xl font-bold text-white mb-2">Pembayaran Berhasil!</p>
              <p className="text-slate-400 mb-4">
                Anda telah berhasil upgrade ke <strong className="text-emerald-400">{tierInfo.name}</strong>
              </p>
              <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-xl">
                <p className="text-sm text-emerald-400">
                  Semua fitur {tierInfo.name} sudah aktif dan siap digunakan!
                </p>
              </div>
            </div>
          )}

          {/* Step: Failed */}
          {step === 'failed' && (
            <div className="py-8 text-center">
              <div className="w-20 h-20 mx-auto mb-6 bg-red-500/20 rounded-full flex items-center justify-center">
                <span className="material-icons-round text-red-400 text-5xl">error</span>
              </div>
              <p className="text-xl font-bold text-white mb-2">Pembayaran Gagal</p>
              <p className="text-slate-400 mb-4">{error || 'Terjadi kesalahan'}</p>
              <button
                onClick={() => setStep('method')}
                className="px-6 py-3 bg-slate-800 hover:bg-slate-700 text-white rounded-xl transition-colors"
              >
                Coba Lagi
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PaymentModal;
