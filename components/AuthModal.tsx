import React, { useState } from 'react';
import { login, register, loginWithGoogle, loginWithFacebook, LoginCredentials, RegisterData, User } from '../services/authService';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (user: User) => void;
}

const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Login form
  const [loginData, setLoginData] = useState<LoginCredentials>({
    email: '',
    password: '',
  });
  
  // Register form
  const [registerData, setRegisterData] = useState<RegisterData>({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    
    try {
      const result = await login(loginData);
      
      if (result.success && result.user) {
        onSuccess(result.user);
        onClose();
      } else {
        setError(result.error || 'Login gagal');
      }
    } catch (err) {
      setError('Terjadi kesalahan, coba lagi');
    }
    
    setIsLoading(false);
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    
    try {
      const result = await register(registerData);
      
      if (result.success && result.user) {
        onSuccess(result.user);
        onClose();
      } else {
        setError(result.error || 'Registrasi gagal');
      }
    } catch (err) {
      setError('Terjadi kesalahan, coba lagi');
    }
    
    setIsLoading(false);
  };

  const switchMode = () => {
    setMode(mode === 'login' ? 'register' : 'login');
    setError('');
  };

  const [socialLoading, setSocialLoading] = useState<'google' | 'facebook' | null>(null);

  const handleGoogleLogin = async () => {
    setSocialLoading('google');
    setError('');
    
    try {
      const result = await loginWithGoogle();
      
      if (result.success && result.user) {
        onSuccess(result.user);
        onClose();
      } else {
        setError(result.error || 'Login dengan Google gagal');
      }
    } catch (err) {
      setError('Terjadi kesalahan saat login dengan Google');
    }
    
    setSocialLoading(null);
  };

  const handleFacebookLogin = async () => {
    setSocialLoading('facebook');
    setError('');
    
    try {
      const result = await loginWithFacebook();
      
      if (result.success && result.user) {
        onSuccess(result.user);
        onClose();
      } else {
        setError(result.error || 'Login dengan Facebook gagal');
      }
    } catch (err) {
      setError('Terjadi kesalahan saat login dengan Facebook');
    }
    
    setSocialLoading(null);
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
        {/* Header with gradient */}
        <div className="relative p-6 pb-4 bg-gradient-to-br from-blue-600/20 to-purple-600/20 border-b border-slate-700/50">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 w-8 h-8 rounded-full bg-slate-800/50 hover:bg-slate-700/50 flex items-center justify-center text-slate-400 hover:text-white transition-all"
          >
            <span className="material-icons-round text-lg">close</span>
          </button>
          
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center shadow-lg">
              <span className="material-icons-round text-white text-2xl">
                {mode === 'login' ? 'login' : 'person_add'}
              </span>
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">
                {mode === 'login' ? 'Masuk ke RIZBOT' : 'Daftar Akun Baru'}
              </h2>
              <p className="text-sm text-slate-400">
                {mode === 'login' ? 'Selamat datang kembali!' : 'Mulai trading dengan AI'}
              </p>
            </div>
          </div>
          
          {/* Tab Switcher */}
          <div className="flex bg-slate-800/50 rounded-lg p-1">
            <button
              onClick={() => setMode('login')}
              className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all ${
                mode === 'login'
                  ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Masuk
            </button>
            <button
              onClick={() => setMode('register')}
              className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all ${
                mode === 'register'
                  ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Daftar
            </button>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={mode === 'login' ? handleLogin : handleRegister} className="p-6 space-y-4">
          {/* Error Message */}
          {error && (
            <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg flex items-center gap-2 text-red-400 text-sm">
              <span className="material-icons-round text-lg">error</span>
              {error}
            </div>
          )}

          {/* Register: Name Field */}
          {mode === 'register' && (
            <div>
              <label className="block text-sm text-slate-400 mb-1.5">Nama Lengkap</label>
              <div className="relative">
                <span className="material-icons-round absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-lg">person</span>
                <input
                  type="text"
                  value={registerData.name}
                  onChange={(e) => setRegisterData({ ...registerData, name: e.target.value })}
                  placeholder="Masukkan nama lengkap"
                  className="w-full bg-slate-800/50 border border-slate-700/50 rounded-xl pl-10 pr-4 py-3 text-white placeholder:text-slate-600 focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all"
                  required
                />
              </div>
            </div>
          )}

          {/* Email Field */}
          <div>
            <label className="block text-sm text-slate-400 mb-1.5">Email</label>
            <div className="relative">
              <span className="material-icons-round absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-lg">email</span>
              <input
                type="email"
                value={mode === 'login' ? loginData.email : registerData.email}
                onChange={(e) => mode === 'login' 
                  ? setLoginData({ ...loginData, email: e.target.value })
                  : setRegisterData({ ...registerData, email: e.target.value })
                }
                placeholder="nama@email.com"
                className="w-full bg-slate-800/50 border border-slate-700/50 rounded-xl pl-10 pr-4 py-3 text-white placeholder:text-slate-600 focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all"
                required
              />
            </div>
          </div>

          {/* Password Field */}
          <div>
            <label className="block text-sm text-slate-400 mb-1.5">Password</label>
            <div className="relative">
              <span className="material-icons-round absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-lg">lock</span>
              <input
                type={showPassword ? 'text' : 'password'}
                value={mode === 'login' ? loginData.password : registerData.password}
                onChange={(e) => mode === 'login'
                  ? setLoginData({ ...loginData, password: e.target.value })
                  : setRegisterData({ ...registerData, password: e.target.value })
                }
                placeholder="Masukkan password"
                className="w-full bg-slate-800/50 border border-slate-700/50 rounded-xl pl-10 pr-12 py-3 text-white placeholder:text-slate-600 focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all"
                required
                minLength={6}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white transition-colors"
              >
                <span className="material-icons-round text-lg">
                  {showPassword ? 'visibility_off' : 'visibility'}
                </span>
              </button>
            </div>
          </div>

          {/* Register: Confirm Password */}
          {mode === 'register' && (
            <div>
              <label className="block text-sm text-slate-400 mb-1.5">Konfirmasi Password</label>
              <div className="relative">
                <span className="material-icons-round absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-lg">lock</span>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={registerData.confirmPassword}
                  onChange={(e) => setRegisterData({ ...registerData, confirmPassword: e.target.value })}
                  placeholder="Ulangi password"
                  className="w-full bg-slate-800/50 border border-slate-700/50 rounded-xl pl-10 pr-4 py-3 text-white placeholder:text-slate-600 focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all"
                  required
                  minLength={6}
                />
              </div>
            </div>
          )}

          {/* Forgot Password (Login only) */}
          {mode === 'login' && (
            <div className="text-right">
              <button
                type="button"
                className="text-sm text-blue-400 hover:text-blue-300 transition-colors"
              >
                Lupa password?
              </button>
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-400 hover:to-purple-400 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold rounded-xl transition-all shadow-lg shadow-blue-500/20 flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <>
                <span className="material-icons-round animate-spin text-lg">sync</span>
                Memproses...
              </>
            ) : (
              <>
                <span className="material-icons-round text-lg">
                  {mode === 'login' ? 'login' : 'person_add'}
                </span>
                {mode === 'login' ? 'Masuk' : 'Daftar Sekarang'}
              </>
            )}
          </button>

          {/* Divider */}
          <div className="relative py-4">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-700/50"></div>
            </div>
            <div className="relative flex justify-center">
              <span className="bg-[#141c2f] px-4 text-sm text-slate-500">atau</span>
            </div>
          </div>

          {/* Social Login */}
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={handleGoogleLogin}
              disabled={isLoading || socialLoading !== null}
              className="flex items-center justify-center gap-2 py-2.5 bg-slate-800/50 hover:bg-slate-700/50 border border-slate-700/50 rounded-xl text-slate-300 text-sm font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {socialLoading === 'google' ? (
                <svg className="w-5 h-5 animate-spin" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
                </svg>
              ) : (
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path fill="currentColor" d="M21.35 11.1h-9.17v2.73h6.51c-.33 3.81-3.5 5.44-6.5 5.44C8.36 19.27 5 16.25 5 12c0-4.1 3.2-7.27 7.2-7.27 3.09 0 4.9 1.97 4.9 1.97L19 4.72S16.56 2 12.1 2C6.42 2 2.03 6.8 2.03 12c0 5.05 4.13 10 10.22 10 5.35 0 9.25-3.67 9.25-9.09 0-1.15-.15-1.81-.15-1.81z"/>
                </svg>
              )}
              {socialLoading === 'google' ? 'Loading...' : 'Google'}
            </button>
            <button
              type="button"
              onClick={handleFacebookLogin}
              disabled={isLoading || socialLoading !== null}
              className="flex items-center justify-center gap-2 py-2.5 bg-slate-800/50 hover:bg-slate-700/50 border border-slate-700/50 rounded-xl text-slate-300 text-sm font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {socialLoading === 'facebook' ? (
                <svg className="w-5 h-5 animate-spin" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
                </svg>
              ) : (
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path fill="currentColor" d="M12 2C6.477 2 2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.879V14.89h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.989C18.343 21.129 22 16.99 22 12c0-5.523-4.477-10-10-10z"/>
                </svg>
              )}
              {socialLoading === 'facebook' ? 'Loading...' : 'Facebook'}
            </button>
          </div>
        </form>

        {/* Footer */}
        <div className="p-4 bg-slate-800/30 border-t border-slate-700/50 text-center">
          <p className="text-sm text-slate-500">
            {mode === 'login' ? (
              <>
                Belum punya akun?{' '}
                <button onClick={switchMode} className="text-blue-400 hover:text-blue-300 font-medium">
                  Daftar gratis
                </button>
              </>
            ) : (
              <>
                Sudah punya akun?{' '}
                <button onClick={switchMode} className="text-blue-400 hover:text-blue-300 font-medium">
                  Masuk
                </button>
              </>
            )}
          </p>
        </div>
      </div>
    </div>
  );
};

export default AuthModal;
