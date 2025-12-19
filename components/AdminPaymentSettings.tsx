/**
 * Admin Payment Settings Component
 * Untuk admin mengatur nomor rekening pembayaran
 */

import React, { useState, useEffect } from 'react';
import {
  PaymentAccountConfig,
  getPaymentConfig,
  savePaymentConfig,
  formatPhoneNumber,
  formatAccountNumber,
} from '../services/adminPaymentConfig';
import { getSession } from '../services/authService';

interface AdminPaymentSettingsProps {
  isOpen: boolean;
  onClose: () => void;
}

const AdminPaymentSettings: React.FC<AdminPaymentSettingsProps> = ({ isOpen, onClose }) => {
  const [config, setConfig] = useState<PaymentAccountConfig>(getPaymentConfig());
  const [activeTab, setActiveTab] = useState<'ewallet' | 'bank'>('ewallet');
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  
  const user = getSession();
  
  // Check if user is admin
  if (!user?.isAdmin) {
    return null;
  }

  useEffect(() => {
    if (isOpen) {
      setConfig(getPaymentConfig());
      setSaveSuccess(false);
    }
  }, [isOpen]);

  const handleSave = () => {
    setIsSaving(true);
    const success = savePaymentConfig(config);
    setIsSaving(false);
    
    if (success) {
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    }
  };

  const updateEWallet = (
    method: 'dana' | 'gopay' | 'ovo',
    field: 'enabled' | 'phoneNumber' | 'accountName' | 'qrCodeUrl',
    value: string | boolean
  ) => {
    setConfig(prev => ({
      ...prev,
      [method]: {
        ...prev[method],
        [field]: value,
      },
    }));
  };

  const updateBank = (
    method: 'bni' | 'bca' | 'mandiri',
    field: 'enabled' | 'accountNumber' | 'accountName' | 'branch',
    value: string | boolean
  ) => {
    setConfig(prev => ({
      ...prev,
      [method]: {
        ...prev[method],
        [field]: value,
      },
    }));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div className="relative bg-[#0f1629] rounded-2xl border border-slate-700/50 shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-700/50 bg-gradient-to-r from-purple-500/10 to-pink-500/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center">
              <span className="material-icons-round text-white">admin_panel_settings</span>
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Pengaturan Pembayaran</h2>
              <p className="text-sm text-slate-400">Kelola nomor rekening & akun pembayaran</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-700/50 rounded-lg transition-colors">
            <span className="material-icons-round text-slate-400">close</span>
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-slate-700/50">
          <button
            onClick={() => setActiveTab('ewallet')}
            className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
              activeTab === 'ewallet'
                ? 'text-blue-400 border-b-2 border-blue-400 bg-blue-500/5'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <span className="material-icons-round text-lg mr-2 align-middle">account_balance_wallet</span>
            E-Wallet
          </button>
          <button
            onClick={() => setActiveTab('bank')}
            className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
              activeTab === 'bank'
                ? 'text-orange-400 border-b-2 border-orange-400 bg-orange-500/5'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <span className="material-icons-round text-lg mr-2 align-middle">account_balance</span>
            Bank Transfer
          </button>
        </div>

        {/* Content */}
        <div className="p-5 max-h-[60vh] overflow-y-auto">
          {/* E-Wallet Settings */}
          {activeTab === 'ewallet' && (
            <div className="space-y-6">
              {/* DANA */}
              <div className="p-4 bg-slate-800/30 rounded-xl border border-slate-700/50">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-[#108ee9] rounded-lg flex items-center justify-center">
                      <span className="text-white font-bold text-sm">DANA</span>
                    </div>
                    <div>
                      <p className="font-semibold text-white">DANA</p>
                      <p className="text-xs text-slate-400">E-Wallet</p>
                    </div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={config.dana.enabled}
                      onChange={(e) => updateEWallet('dana', 'enabled', e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-500"></div>
                  </label>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs text-slate-400 mb-1">Nomor HP DANA</label>
                    <input
                      type="text"
                      value={config.dana.phoneNumber}
                      onChange={(e) => updateEWallet('dana', 'phoneNumber', e.target.value)}
                      placeholder="081234567890"
                      className="w-full px-3 py-2 bg-slate-900/50 border border-slate-700/50 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-400 mb-1">Nama Akun</label>
                    <input
                      type="text"
                      value={config.dana.accountName}
                      onChange={(e) => updateEWallet('dana', 'accountName', e.target.value)}
                      placeholder="Nama pemilik akun"
                      className="w-full px-3 py-2 bg-slate-900/50 border border-slate-700/50 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                    />
                  </div>
                </div>
                <div className="mt-3">
                  <label className="block text-xs text-slate-400 mb-1">URL QR Code (opsional)</label>
                  <input
                    type="text"
                    value={config.dana.qrCodeUrl || ''}
                    onChange={(e) => updateEWallet('dana', 'qrCodeUrl', e.target.value)}
                    placeholder="https://..."
                    className="w-full px-3 py-2 bg-slate-900/50 border border-slate-700/50 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              {/* GoPay */}
              <div className="p-4 bg-slate-800/30 rounded-xl border border-slate-700/50">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-green-600 rounded-lg flex items-center justify-center">
                      <span className="text-white font-bold text-xs">GoPay</span>
                    </div>
                    <div>
                      <p className="font-semibold text-white">GoPay</p>
                      <p className="text-xs text-slate-400">E-Wallet</p>
                    </div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={config.gopay.enabled}
                      onChange={(e) => updateEWallet('gopay', 'enabled', e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-500"></div>
                  </label>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs text-slate-400 mb-1">Nomor HP GoPay</label>
                    <input
                      type="text"
                      value={config.gopay.phoneNumber}
                      onChange={(e) => updateEWallet('gopay', 'phoneNumber', e.target.value)}
                      placeholder="081234567890"
                      className="w-full px-3 py-2 bg-slate-900/50 border border-slate-700/50 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-green-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-400 mb-1">Nama Akun</label>
                    <input
                      type="text"
                      value={config.gopay.accountName}
                      onChange={(e) => updateEWallet('gopay', 'accountName', e.target.value)}
                      placeholder="Nama pemilik akun"
                      className="w-full px-3 py-2 bg-slate-900/50 border border-slate-700/50 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-green-500"
                    />
                  </div>
                </div>
                <div className="mt-3">
                  <label className="block text-xs text-slate-400 mb-1">URL QR Code (opsional)</label>
                  <input
                    type="text"
                    value={config.gopay.qrCodeUrl || ''}
                    onChange={(e) => updateEWallet('gopay', 'qrCodeUrl', e.target.value)}
                    placeholder="https://..."
                    className="w-full px-3 py-2 bg-slate-900/50 border border-slate-700/50 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-green-500"
                  />
                </div>
              </div>

              {/* OVO */}
              <div className="p-4 bg-slate-800/30 rounded-xl border border-slate-700/50">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg flex items-center justify-center">
                      <span className="text-white font-bold text-sm">OVO</span>
                    </div>
                    <div>
                      <p className="font-semibold text-white">OVO</p>
                      <p className="text-xs text-slate-400">E-Wallet</p>
                    </div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={config.ovo.enabled}
                      onChange={(e) => updateEWallet('ovo', 'enabled', e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-500"></div>
                  </label>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs text-slate-400 mb-1">Nomor HP OVO</label>
                    <input
                      type="text"
                      value={config.ovo.phoneNumber}
                      onChange={(e) => updateEWallet('ovo', 'phoneNumber', e.target.value)}
                      placeholder="081234567890"
                      className="w-full px-3 py-2 bg-slate-900/50 border border-slate-700/50 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-purple-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-400 mb-1">Nama Akun</label>
                    <input
                      type="text"
                      value={config.ovo.accountName}
                      onChange={(e) => updateEWallet('ovo', 'accountName', e.target.value)}
                      placeholder="Nama pemilik akun"
                      className="w-full px-3 py-2 bg-slate-900/50 border border-slate-700/50 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-purple-500"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Bank Settings */}
          {activeTab === 'bank' && (
            <div className="space-y-6">
              {/* BNI */}
              <div className="p-4 bg-slate-800/30 rounded-xl border border-slate-700/50">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg flex items-center justify-center">
                      <span className="text-white font-bold text-sm">BNI</span>
                    </div>
                    <div>
                      <p className="font-semibold text-white">Bank BNI</p>
                      <p className="text-xs text-slate-400">Transfer Bank</p>
                    </div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={config.bni.enabled}
                      onChange={(e) => updateBank('bni', 'enabled', e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-orange-500"></div>
                  </label>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs text-slate-400 mb-1">Nomor Rekening</label>
                    <input
                      type="text"
                      value={config.bni.accountNumber}
                      onChange={(e) => updateBank('bni', 'accountNumber', e.target.value)}
                      placeholder="1234567890"
                      className="w-full px-3 py-2 bg-slate-900/50 border border-slate-700/50 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-orange-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-400 mb-1">Nama Pemilik Rekening</label>
                    <input
                      type="text"
                      value={config.bni.accountName}
                      onChange={(e) => updateBank('bni', 'accountName', e.target.value)}
                      placeholder="Nama sesuai rekening"
                      className="w-full px-3 py-2 bg-slate-900/50 border border-slate-700/50 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-orange-500"
                    />
                  </div>
                </div>
                <div className="mt-3">
                  <label className="block text-xs text-slate-400 mb-1">Cabang (opsional)</label>
                  <input
                    type="text"
                    value={config.bni.branch || ''}
                    onChange={(e) => updateBank('bni', 'branch', e.target.value)}
                    placeholder="KCP Jakarta Pusat"
                    className="w-full px-3 py-2 bg-slate-900/50 border border-slate-700/50 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-orange-500"
                  />
                </div>
              </div>

              {/* BCA */}
              <div className="p-4 bg-slate-800/30 rounded-xl border border-slate-700/50">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-blue-700 rounded-lg flex items-center justify-center">
                      <span className="text-white font-bold text-sm">BCA</span>
                    </div>
                    <div>
                      <p className="font-semibold text-white">Bank BCA</p>
                      <p className="text-xs text-slate-400">Transfer Bank</p>
                    </div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={config.bca.enabled}
                      onChange={(e) => updateBank('bca', 'enabled', e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-500"></div>
                  </label>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs text-slate-400 mb-1">Nomor Rekening</label>
                    <input
                      type="text"
                      value={config.bca.accountNumber}
                      onChange={(e) => updateBank('bca', 'accountNumber', e.target.value)}
                      placeholder="1234567890"
                      className="w-full px-3 py-2 bg-slate-900/50 border border-slate-700/50 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-400 mb-1">Nama Pemilik Rekening</label>
                    <input
                      type="text"
                      value={config.bca.accountName}
                      onChange={(e) => updateBank('bca', 'accountName', e.target.value)}
                      placeholder="Nama sesuai rekening"
                      className="w-full px-3 py-2 bg-slate-900/50 border border-slate-700/50 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                    />
                  </div>
                </div>
              </div>

              {/* Mandiri */}
              <div className="p-4 bg-slate-800/30 rounded-xl border border-slate-700/50">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-lg flex items-center justify-center">
                      <span className="text-white font-bold text-xs">MDR</span>
                    </div>
                    <div>
                      <p className="font-semibold text-white">Bank Mandiri</p>
                      <p className="text-xs text-slate-400">Transfer Bank</p>
                    </div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={config.mandiri.enabled}
                      onChange={(e) => updateBank('mandiri', 'enabled', e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-yellow-500"></div>
                  </label>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs text-slate-400 mb-1">Nomor Rekening</label>
                    <input
                      type="text"
                      value={config.mandiri.accountNumber}
                      onChange={(e) => updateBank('mandiri', 'accountNumber', e.target.value)}
                      placeholder="1234567890"
                      className="w-full px-3 py-2 bg-slate-900/50 border border-slate-700/50 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-yellow-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-400 mb-1">Nama Pemilik Rekening</label>
                    <input
                      type="text"
                      value={config.mandiri.accountName}
                      onChange={(e) => updateBank('mandiri', 'accountName', e.target.value)}
                      placeholder="Nama sesuai rekening"
                      className="w-full px-3 py-2 bg-slate-900/50 border border-slate-700/50 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-yellow-500"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-5 border-t border-slate-700/50 bg-slate-900/30">
          <div className="flex items-center gap-2 text-sm">
            {saveSuccess && (
              <span className="text-emerald-400 flex items-center gap-1">
                <span className="material-icons-round text-lg">check_circle</span>
                Tersimpan!
              </span>
            )}
          </div>
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition-colors"
            >
              Batal
            </button>
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="px-6 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-semibold rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center gap-2"
            >
              {isSaving ? (
                <>
                  <span className="material-icons-round animate-spin text-lg">sync</span>
                  Menyimpan...
                </>
              ) : (
                <>
                  <span className="material-icons-round text-lg">save</span>
                  Simpan
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminPaymentSettings;
