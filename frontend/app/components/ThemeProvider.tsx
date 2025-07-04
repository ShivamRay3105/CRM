"use client"

import { createContext, useContext, useEffect, useState } from "react"

type Theme = "light" | "dark"

interface ThemeContextType {
  theme: Theme
  toggleTheme: () => void
  isDark: boolean
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>("light")
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    // Check if theme is stored in memory (since we can't use localStorage)
    const savedTheme = (globalThis as any).__theme || "light"
    setTheme(savedTheme)
    
    // Apply theme to document
    document.documentElement.classList.toggle("dark", savedTheme === "dark")
  }, [])

  const toggleTheme = () => {
    const newTheme = theme === "light" ? "dark" : "light"
    setTheme(newTheme)
    
    // Store in global variable (since localStorage isn't available)
    ;(globalThis as any).__theme = newTheme
    
    // Apply theme to document
    document.documentElement.classList.toggle("dark", newTheme === "dark")
  }

  const value = {
    theme,
    toggleTheme,
    isDark: theme === "dark",
  }

  // Prevent hydration mismatch
  if (!mounted) {
    return null
  }

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  const context = useContext(ThemeContext)
  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider")
  }
  return context
}