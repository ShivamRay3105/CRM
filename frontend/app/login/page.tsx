"use client"

import { useState, type FormEvent, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"

interface LoginResponse {
  message?: string
  username?: string
  error?: string
}

interface UserResponse {
  username?: string
  role?: string
}

export default function Login() {
  const [username, setUsername] = useState<string>("")
  const [password, setPassword] = useState<string>("")
  const [error, setError] = useState<string>("")
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const [showPassword, setShowPassword] = useState<boolean>(false)
  const [isVisible, setIsVisible] = useState<boolean>(false)
  const router = useRouter()

  useEffect(() => {
    setIsVisible(true)
  }, [])

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError("")
    setIsLoading(true)

    if (!username || !password) {
      setError("Please fill in all fields")
      setIsLoading(false)
      return
    }

    try {
      // Step 1: Authenticate with /api/auth/login
      const loginResponse = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ username, password }),
        credentials: "include",
      })

      console.log("Login Response Status:", loginResponse.status)
      console.log("Login Response Headers:", [...loginResponse.headers.entries()])

const loginContentType = loginResponse.headers.get("Content-Type") || ""
let loginData: LoginResponse = {}

if (loginContentType.includes("application/json")) {
  loginData = await loginResponse.json()
} else {
  const loginText = await loginResponse.text()
  console.warn("Non-JSON login response:", loginText)
  setError("Server error. Please try again later.")
  setIsLoading(false)
  return
}

      if (!loginResponse.ok) {
        setError(loginData.error || "Invalid username or password")
        console.log("Login failed with error:", loginData.error)
        setIsLoading(false)
        return
      }

      // Store username as token
      localStorage.setItem("token", loginData.username || "fallback-token")
      console.log("Stored token:", loginData.username || "fallback-token")

      // Step 2: Fetch user role from /api/users/me
      const userResponse = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/users/me`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
      })

      console.log("User Response Status:", userResponse.status)
      console.log("User Response Headers:", [...userResponse.headers.entries()])

const userContentType = userResponse.headers.get("Content-Type") || ""
let userData: UserResponse = {}

if (userContentType.includes("application/json")) {
  userData = await userResponse.json()
} else {
  const userText = await userResponse.text()
  console.warn("Non-JSON user response:", userText)
  setError("Failed to fetch user details")
  setIsLoading(false)
  return
}


      if (userResponse.ok) {
        const role = userData.role?.replace("ROLE_", "").toLowerCase() || "employee"
        console.log("Determined role:", role)

        // Add a small delay for better UX
        setTimeout(() => {
          switch (role) {
            case "admin":
              console.log("Redirecting to /admin/dashboard")
              router.push("/admin/dashboard")
              break
            case "manager":
              console.log("Redirecting to /manager/dashboard")
              router.push("/manager/dashboard")
              break
            case "employee":
              console.log("Redirecting to /employee/dashboard")
              router.push("/employee/dashboard")
              break
            default:
              setError("Unknown user role")
              console.log("Error: Unknown user role")
              setIsLoading(false)
          }
        }, 1000)
      } else {
        setError("Failed to fetch user details")
        console.log("User fetch failed")
        setIsLoading(false)
      }
    } catch (err: unknown) {
      setError("An error occurred. Please try again later.")
      console.error("Login error:", err)
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50 to-indigo-100 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-purple-300/20 rounded-full blur-3xl animate-pulse"></div>
        <div
          className="absolute top-3/4 right-1/4 w-96 h-96 bg-indigo-300/20 rounded-full blur-3xl animate-pulse"
          style={{ animationDelay: "2s" }}
        ></div>
        <div
          className="absolute bottom-1/4 left-1/3 w-48 h-48 bg-violet-300/20 rounded-full blur-3xl animate-pulse"
          style={{ animationDelay: "4s" }}
        ></div>
      </div>

      {/* Floating Particles */}
     {isVisible && (
  <div className="absolute inset-0 overflow-hidden pointer-events-none">
    {[...Array(20)].map((_, i) => {
      const left = Math.random() * 100
      const top = Math.random() * 100
      const delay = Math.random() * 5
      const duration = 3 + Math.random() * 4

      return (
        <div
          key={i}
          className="absolute w-2 h-2 bg-purple-400/30 rounded-full animate-bounce"
          style={{
            left: `${left}%`,
            top: `${top}%`,
            animationDelay: `${delay}s`,
            animationDuration: `${duration}s`,
          }}
        ></div>
      )
    })}
  </div>
)}


      {/* Main Login Container */}
      <div
        className={`relative w-full max-w-md transition-all duration-1000 transform ${
          isVisible ? "translate-y-0 opacity-100" : "translate-y-10 opacity-0"
        }`}
      >
        {/* Glass Card */}
        <div className="bg-white/80 backdrop-blur-xl border border-white/30 rounded-3xl shadow-2xl shadow-purple-500/20 overflow-hidden">
          {/* Header Section */}
          <div className="bg-gradient-to-r from-purple-600 via-indigo-600 to-violet-600 p-8 text-center relative">
            {/* Animated background overlay */}
            <div className="absolute inset-0 bg-gradient-to-r from-purple-400/20 via-indigo-400/20 to-violet-400/20 animate-pulse"></div>

            {/* Logo */}
            <div className="relative mb-4">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-white/20 rounded-2xl backdrop-blur-sm border border-white/30 shadow-xl">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
            </div>

            <h1 className="text-3xl font-bold text-white mb-2">Welcome Back</h1>
            <p className="text-white/80 font-medium">Sign in to Phoenix CRM Solutions</p>

            {/* Decorative Elements */}
            <div className="absolute top-4 right-4 w-20 h-20 border border-white/20 rounded-full"></div>
            <div className="absolute bottom-4 left-4 w-12 h-12 border border-white/20 rounded-full"></div>
          </div>

          {/* Form Section */}
          <div className="p-8">
            {/* Error Alert */}
            {error && (
              <div className="mb-6 p-4 bg-gradient-to-r from-red-50 to-rose-50 border border-red-200 rounded-2xl shadow-sm animate-in fade-in slide-in-from-top duration-300">
                <div className="flex items-center">
                  <svg
                    className="w-5 h-5 text-red-500 mr-3 flex-shrink-0"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  <span className="text-red-800 font-medium text-sm">{error}</span>
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Username Field */}
              <div className="space-y-2">
                <label htmlFor="username" className="block text-sm font-semibold text-slate-800">
                  Username
                </label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <svg
                      className="w-5 h-5 text-slate-400 group-focus-within:text-purple-600 transition-colors duration-300"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                      />
                    </svg>
                  </div>
                  <input
                    id="username"
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full pl-12 pr-4 py-4 border border-slate-200 rounded-2xl shadow-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white/90 backdrop-blur-sm transition-all duration-300 text-slate-800 placeholder-slate-400 hover:bg-gradient-to-r hover:from-purple-50/50 hover:to-indigo-50/50 group-focus-within:shadow-lg group-focus-within:shadow-purple-500/20"
                    placeholder="Enter your username"
                    required
                    disabled={isLoading}
                  />
                  <div className="absolute inset-0 rounded-2xl border-2 border-purple-500 opacity-0 group-focus-within:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
                </div>
              </div>

              {/* Password Field */}
              <div className="space-y-2">
                <label htmlFor="password" className="block text-sm font-semibold text-slate-800">
                  Password
                </label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <svg
                      className="w-5 h-5 text-slate-400 group-focus-within:text-purple-600 transition-colors duration-300"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                      />
                    </svg>
                  </div>
                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-12 pr-12 py-4 border border-slate-200 rounded-2xl shadow-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white/90 backdrop-blur-sm transition-all duration-300 text-slate-800 placeholder-slate-400 hover:bg-gradient-to-r hover:from-purple-50/50 hover:to-indigo-50/50 group-focus-within:shadow-lg group-focus-within:shadow-purple-500/20"
                    placeholder="Enter your password"
                    required
                    disabled={isLoading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-400 hover:text-purple-600 transition-colors duration-300"
                    disabled={isLoading}
                  >
                    {showPassword ? (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21"
                        />
                      </svg>
                    ) : (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                        />
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                        />
                      </svg>
                    )}
                  </button>
                  <div className="absolute inset-0 rounded-2xl border-2 border-purple-500 opacity-0 group-focus-within:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isLoading}
                className="group relative w-full overflow-hidden bg-gradient-to-r from-purple-600 via-indigo-600 to-violet-600 text-white py-4 rounded-2xl hover:from-purple-700 hover:via-indigo-700 hover:to-violet-700 transition-all duration-300 shadow-xl hover:shadow-2xl hover:shadow-purple-500/30 transform hover:scale-[1.02] disabled:opacity-70 disabled:cursor-not-allowed disabled:transform-none font-bold text-lg"
              >
                {/* Animated background */}
                <div className="absolute inset-0 bg-gradient-to-r from-purple-400/20 via-indigo-400/20 to-violet-400/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>

                <span className="relative z-10 flex items-center justify-center gap-3">
                  {isLoading ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      Signing In...
                    </>
                  ) : (
                    <>
                      <svg
                        className="w-5 h-5 group-hover:scale-110 transition-transform duration-300"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1"
                        />
                      </svg>
                      Sign In
                    </>
                  )}
                </span>

                {/* Ripple effect */}
                <div className="absolute inset-0 bg-white/10 rounded-2xl opacity-0 group-active:opacity-100 transition-opacity duration-150"></div>
              </button>
            </form>

            {/* Footer Links */}
            <div className="mt-8 text-center space-y-4">

              <div className="flex items-center justify-center gap-4 pt-4 border-t border-slate-200">
                <div className="flex items-center gap-2 text-xs text-slate-500">
                  <svg className="w-4 h-4 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.031 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                    />
                  </svg>
                  Secure Login
                </div>
                <div className="w-px h-4 bg-slate-300"></div>
                <div className="flex items-center gap-2 text-xs text-slate-500">
                  <svg className="w-4 h-4 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  Phoenix CRM
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Decorative Element */}
        <div className="mt-8 text-center">
          <div className="inline-flex items-center gap-2 text-sm text-slate-600 bg-white/60 backdrop-blur-sm px-4 py-2 rounded-full border border-white/30 shadow-lg">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            System Status: Online
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes slideInUp {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        .animate-in {
          animation: slideInUp 0.6s ease-out forwards;
        }
      `}</style>
    </div>
  )
}
