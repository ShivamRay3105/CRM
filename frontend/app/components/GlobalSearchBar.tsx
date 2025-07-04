// GlobalSearchBar.jsx
"use client";

import { useState, useEffect } from "react";

/**
 * @interface GlobalSearchBarProps
 * @property {(searchTerm: string) => void} onSearchChange - Callback function triggered when the search term changes after debounce.
 * @property {string} [searchPlaceholder="Search all items..."] - Placeholder text for the search input.
 */
interface GlobalSearchBarProps {
  onSearchChange: (searchTerm: string) => void;
  searchPlaceholder?: string;
}

/**
 * GlobalSearchBar Component
 * A reusable search bar component with a debounced input for efficient searching.
 * It provides a search term to its parent component via the onSearchChange callback.
 *
 * @param {GlobalSearchBarProps} props - The component props.
 * @returns {JSX.Element} The GlobalSearchBar component.
 */
export default function GlobalSearchBar({
  onSearchChange,
  searchPlaceholder = "Search all items...",
}: GlobalSearchBarProps) {
  const [searchTerm, setSearchTerm] = useState("");

  // Debounced search effect: calls onSearchChange after a delay
  useEffect(() => {
    const timer = setTimeout(() => {
      onSearchChange(searchTerm);
    }, 300); // 300ms debounce delay

    // Cleanup function to clear the timer if the component unmounts or searchTerm changes again
    return () => clearTimeout(timer);
  }, [searchTerm, onSearchChange]); // Re-run effect when searchTerm or onSearchChange changes

  return (
    <div className="bg-white/80 backdrop-blur-sm border border-white/20 rounded-2xl shadow-xl overflow-hidden mb-8">
      {/* Header section for the search bar */}
      <div className="bg-gradient-to-r from-purple-600 via-indigo-600 to-violet-600 p-4 sm:p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* Search icon */}
            <div className="w-8 h-8 sm:w-10 sm:h-10 bg-white/20 rounded-xl flex items-center justify-center">
              <svg
                className="w-4 h-4 sm:w-5 sm:h-5 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
            </div>
            <div>
              <h3 className="text-lg sm:text-xl font-bold text-white">
                Global Search
              </h3>
              <p className="text-white/80 text-xs sm:text-sm font-medium">
                Search across names, IDs, and other relevant fields.
              </p>
            </div>
          </div>

          {/* Clear search button (optional, could be added here if needed) */}
          {searchTerm && (
            <button
              onClick={() => setSearchTerm("")}
              className="text-white/80 hover:text-white transition-colors duration-300 p-2 hover:bg-white/10 rounded-xl"
              aria-label="Clear search"
            >
              <svg
                className="w-4 h-4 sm:w-5 sm:h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* Search Bar Input - Always Visible */}
      <div className="p-4 sm:p-6 border-b border-slate-200">
        <div className="relative group">
          <div className="absolute inset-y-0 left-0 pl-3 sm:pl-4 flex items-center pointer-events-none">
            <svg
              className="w-4 h-4 sm:w-5 sm:h-5 text-slate-400 group-focus-within:text-purple-600 transition-colors duration-300"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          </div>
          <input
            type="text"
            placeholder={searchPlaceholder}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-3 sm:pl-12 sm:pr-4 sm:py-4 border border-slate-200 rounded-2xl shadow-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white/90 backdrop-blur-sm transition-all duration-300 text-slate-800 placeholder-slate-400 hover:bg-gradient-to-r hover:from-purple-50/50 hover:to-indigo-50/50 group-focus-within:shadow-lg group-focus-within:shadow-purple-500/20"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm("")}
              className="absolute inset-y-0 right-0 pr-3 sm:pr-4 flex items-center text-slate-400 hover:text-purple-600 transition-colors duration-300"
              aria-label="Clear search input"
            >
              <svg
                className="w-4 h-4 sm:w-5 sm:h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          )}
          <div className="absolute inset-0 rounded-2xl border-2 border-purple-500 opacity-0 group-focus-within:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
        </div>
      </div>
    </div>
  );
}
