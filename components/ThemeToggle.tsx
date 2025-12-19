import React from 'react';
import { useTheme } from '../contexts/ThemeContext';

const ThemeToggle: React.FC = () => {
  const { theme, toggleTheme, isDark } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      className={`relative w-14 h-7 rounded-full p-1 transition-all duration-300 ${
        isDark 
          ? 'bg-slate-700 hover:bg-slate-600' 
          : 'bg-blue-100 hover:bg-blue-200'
      }`}
      title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
    >
      {/* Background icons */}
      <div className="absolute inset-0 flex items-center justify-between px-1.5">
        <span className={`material-icons-round text-xs transition-opacity duration-300 ${
          isDark ? 'opacity-30 text-slate-400' : 'opacity-100 text-amber-500'
        }`}>
          light_mode
        </span>
        <span className={`material-icons-round text-xs transition-opacity duration-300 ${
          isDark ? 'opacity-100 text-blue-400' : 'opacity-30 text-slate-400'
        }`}>
          dark_mode
        </span>
      </div>
      
      {/* Toggle circle */}
      <div
        className={`w-5 h-5 rounded-full shadow-md transform transition-all duration-300 flex items-center justify-center ${
          isDark 
            ? 'translate-x-7 bg-slate-900' 
            : 'translate-x-0 bg-white'
        }`}
      >
        <span className={`material-icons-round text-xs ${
          isDark ? 'text-blue-400' : 'text-amber-500'
        }`}>
          {isDark ? 'dark_mode' : 'light_mode'}
        </span>
      </div>
    </button>
  );
};

export default ThemeToggle;
