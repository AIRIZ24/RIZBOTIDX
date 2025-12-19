/**
 * API Key Settings Component
 * Allows users to securely input and manage their RIZBOT AI API key
 */

import React, { useState, useEffect } from 'react';
import { 
  hasAPIKey, 
  setUserAPIKey, 
  removeUserAPIKey,
  getSecureAPIKey,
  logSecurityEvent 
} from '../services/securityService';

interface APIKeySettingsProps {
  isOpen: boolean;
  onClose: () => void;
  onKeySet?: () => void;
}

const APIKeySettings: React.FC<APIKeySettingsProps> = ({ isOpen, onClose, onKeySet }) => {
  const [apiKey, setApiKey] = useState('');
  const [hasKey, setHasKey] = useState(false);
  const [showKey, setShowKey] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setHasKey(hasAPIKey());
      setApiKey('');
      setError('');
      setSuccess('');
      setShowKey(false);
    }
  }, [isOpen]);

  const handleSaveKey = async () => {
    setError('');
    setSuccess('');
    setIsLoading(true);

    try {
      // Validate API key format
      if (!apiKey || apiKey.length < 20) {
        setError('API Key tidak valid. Key harus minimal 20 karakter.');
        return;
      }

      if (!apiKey.startsWith('AIza')) {
        setError('Format API Key tidak valid. Pastikan key yang Anda masukkan benar.');
        return;
      }

      // Test the API key by making a simple request
      // In production, you'd want to validate this on the server
      setUserAPIKey(apiKey);
      setHasKey(true);
      setSuccess('API Key berhasil disimpan!');
      setApiKey('');
      
      logSecurityEvent('API_KEY_SET', 'User set their API key');
      
      if (onKeySet) {
        onKeySet();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal menyimpan API Key');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemoveKey = () => {
    removeUserAPIKey();
    setHasKey(false);
    setApiKey('');
    setSuccess('API Key berhasil dihapus.');
    logSecurityEvent('API_KEY_REMOVED', 'User removed their API key');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-[#141c2f] rounded-2xl border border-slate-700/50 shadow-2xl w-full max-w-md mx-4 overflow-hidden">
        {/* Header */}
        <div className="p-5 border-b border-slate-700/50">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-white flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shadow-lg">
                <span className="material-icons-round text-white">key</span>
              </div>
              API Key Settings
            </h2>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-lg bg-slate-800/50 hover:bg-slate-700 flex items-center justify-center text-slate-400 hover:text-white transition-colors"
            >
              <span className="material-icons-round text-lg">close</span>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4">
          {/* Security Notice */}
          <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30">
            <div className="flex items-start gap-3">
              <span className="material-icons-round text-amber-400 text-xl">warning</span>
              <div>
                <p className="text-sm text-amber-200 font-medium">Peringatan Keamanan</p>
                <p className="text-xs text-amber-300/70 mt-1">
                  API Key akan disimpan di browser Anda. Jangan bagikan key ini dengan siapapun. 
                  Untuk keamanan lebih baik, gunakan environment variable.
                </p>
              </div>
            </div>
          </div>

          {/* Status */}
          <div className={`p-4 rounded-xl border ${
            hasKey 
              ? 'bg-emerald-500/10 border-emerald-500/30' 
              : 'bg-slate-800/50 border-slate-700/50'
          }`}>
            <div className="flex items-center gap-3">
              <span className={`material-icons-round text-xl ${
                hasKey ? 'text-emerald-400' : 'text-slate-500'
              }`}>
                {hasKey ? 'check_circle' : 'radio_button_unchecked'}
              </span>
              <div>
                <p className={`text-sm font-medium ${hasKey ? 'text-emerald-200' : 'text-slate-400'}`}>
                  {hasKey ? 'API Key sudah dikonfigurasi' : 'API Key belum dikonfigurasi'}
                </p>
                <p className="text-xs text-slate-500 mt-1">
                  {hasKey 
                    ? 'Fitur AI siap digunakan' 
                    : 'Masukkan API Key untuk mengaktifkan fitur AI'
                  }
                </p>
              </div>
            </div>
          </div>

          {/* Input */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              RIZBOT AI Key
            </label>
            <div className="relative">
              <input
                type={showKey ? 'text' : 'password'}
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder={hasKey ? '••••••••••••••••' : 'Masukkan API Key Anda'}
                className="w-full px-4 py-3 bg-slate-800/50 border border-slate-700/50 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-amber-500/50 pr-12"
              />
              <button
                onClick={() => setShowKey(!showKey)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
              >
                <span className="material-icons-round text-xl">
                  {showKey ? 'visibility_off' : 'visibility'}
                </span>
              </button>
            </div>
            <p className="text-xs text-slate-500 mt-2">
              Dapatkan API Key dari{' '}
              <a 
                href="https://makersuite.google.com/app/apikey" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-amber-400 hover:underline"
              >
                RIZBOT Developer Portal
              </a>
            </p>
          </div>

          {/* Error/Success Messages */}
          {error && (
            <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-300 text-sm flex items-center gap-2">
              <span className="material-icons-round text-lg">error</span>
              {error}
            </div>
          )}

          {success && (
            <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-sm flex items-center gap-2">
              <span className="material-icons-round text-lg">check_circle</span>
              {success}
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3">
            {hasKey && (
              <button
                onClick={handleRemoveKey}
                className="flex-1 py-3 rounded-xl bg-red-500/20 hover:bg-red-500/30 text-red-400 font-medium transition-colors flex items-center justify-center gap-2"
              >
                <span className="material-icons-round text-lg">delete</span>
                Hapus Key
              </button>
            )}
            <button
              onClick={handleSaveKey}
              disabled={!apiKey || isLoading}
              className={`flex-1 py-3 rounded-xl font-medium transition-colors flex items-center justify-center gap-2 ${
                !apiKey || isLoading
                  ? 'bg-slate-800/50 text-slate-600 cursor-not-allowed'
                  : 'bg-gradient-to-r from-amber-500 to-orange-600 text-white hover:from-amber-600 hover:to-orange-700'
              }`}
            >
              {isLoading ? (
                <>
                  <span className="material-icons-round animate-spin text-lg">refresh</span>
                  Menyimpan...
                </>
              ) : (
                <>
                  <span className="material-icons-round text-lg">save</span>
                  {hasKey ? 'Ganti Key' : 'Simpan Key'}
                </>
              )}
            </button>
          </div>

          {/* Info */}
          <div className="p-4 rounded-xl bg-slate-800/30 border border-slate-700/50">
            <h4 className="text-sm font-medium text-slate-300 mb-2 flex items-center gap-2">
              <span className="material-icons-round text-lg text-slate-500">info</span>
              Cara menggunakan Environment Variable
            </h4>
            <ol className="text-xs text-slate-500 space-y-1 list-decimal list-inside">
              <li>Buat file <code className="text-amber-400">.env.local</code> di root project</li>
              <li>Tambahkan: <code className="text-amber-400">VITE_RIZBOT_API_KEY=your_key</code></li>
              <li>Restart development server</li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  );
};

export default APIKeySettings;
