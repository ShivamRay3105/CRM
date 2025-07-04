"use client"

import { useTheme } from "./ThemeProvider"

export default function ThemeToggle() {
  const { theme, toggleTheme } = useTheme()

  return (
    <button
      onClick={toggleTheme}
      className="group relative p-3 bg-gradient-to-r from-purple-600/30 to-indigo-600/30 dark:from-purple-800/40 dark:to-indigo-800/40 rounded-xl border border-purple-500/30 dark:border-purple-400/30 hover:from-purple-500/40 hover:to-indigo-500/40 dark:hover:from-purple-700/50 dark:hover:to-indigo-700/50 transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl dark:shadow-purple-500/10"
      title={`Switch to ${theme === "light" ? "dark" : "light"} mode`}
    >
      {/* Background glow */}
      <div className="absolute inset-0 bg-gradient-to-r from-purple-500/10 to-indigo-500/10 dark:from-purple-400/10 dark:to-indigo-400/10 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 blur-sm"></div>

      {/* Toggle animation container */}
      <div className="relative w-6 h-6 overflow-hidden">
        {/* Sun Icon */}
        <div
          className={`absolute inset-0 transform transition-all duration-500 ${
            theme === "light" 
              ? "rotate-0 scale-100 opacity-100" 
              : "rotate-180 scale-0 opacity-0"
          }`}
        >
          <svg
            className="w-6 h-6 text-yellow-500 dark:text-yellow-400 filter drop-shadow-lg"
            fill="currentColor"
            viewBox="0 0 24 24"
          >
            <path d="M12 2.25a.75.75 0 01.75.75v2.25a.75.75 0 01-1.5 0V3a.75.75 0 01.75-.75zM7.5 12a4.5 4.5 0 119 0 4.5 4.5 0 01-9 0zM18.894 6.166a.75.75 0 00-1.06-1.06l-1.591 1.59a.75.75 0 101.06 1.061l1.591-1.59zM21.75 12a.75.75 0 01-.75.75h-2.25a.75.75 0 010-1.5H21a.75.75 0 01.75.75zM17.834 18.894a.75.75 0 001.06-1.06l-1.59-1.591a.75.75 0 10-1.061 1.06l1.59 1.591zM12 18a.75.75 0 01.75.75V21a.75.75 0 01-1.5 0v-2.25A.75.75 0 0112 18zM7.758 17.303a.75.75 0 00-1.061-1.06l-1.591 1.59a.75.75 0 001.06 1.061l1.591-1.59zM6 12a.75.75 0 01-.75.75H3a.75.75 0 010-1.5h2.25A.75.75 0 016 12zM6.697 7.757a.75.75 0 001.06-1.06l-1.59-1.591a.75.75 0 00-1.061 1.06l1.59 1.591z" />
          </svg>
        </div>

        {/* Moon Icon */}
        <div
          className={`absolute inset-0 transform transition-all duration-500 ${
            theme === "dark" 
              ? "rotate-0 scale-100 opacity-100" 
              : "-rotate-180 scale-0 opacity-0"
          }`}
        >
          <svg
            className="w-6 h-6 text-blue-400 dark:text-blue-300 filter drop-shadow-lg"
            fill="currentColor"
            viewBox="0 0 24 24"
          >
            <path d="M9.528 1.718a.75.75 0 01.162.819A8.97 8.97 0 009 6a9 9 0 009 9 8.97 8.97 0 003.463-.69.75.75 0 01.981.98 10.503 10.503 0 01-9.694 6.46c-5.799 0-10.5-4.701-10.5-10.5 0-4.368 2.667-8.112 6.46-9.694a.75.75 0 01.818.162z" />
          </svg>
        </div>
      </div>

      {/* Ripple effect */}
      <div className="absolute inset-0 bg-white/10 dark:bg-white/5 rounded-xl opacity-0 group-active:opacity-100 transition-opacity duration-150"></div>
    </button>
  )
}