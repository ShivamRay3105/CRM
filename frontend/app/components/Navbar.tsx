"use client"

import { useRouter } from "next/navigation"
import Link from "next/link"
import { useState, useEffect } from "react"

interface NavbarProps {
  role: "admin" | "manager" | "employee"
}

export default function Navbar({ role }: NavbarProps) {
  const router = useRouter()
  const [isScrolled, setIsScrolled] = useState(false)
  const [activeLink, setActiveLink] = useState("")

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20)
    }
    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  useEffect(() => {
    setActiveLink(window.location.pathname)
  }, [])

  const handleLogout = () => {
    localStorage.removeItem("token")
    router.push("/login")
  }

  const navLinks = [
    {
      href: `/${role}/dashboard`,
      label: "Dashboard",
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z"
          />
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M8 5a2 2 0 012-2h4a2 2 0 012 2v6H8V5z"
          />
        </svg>
      ),
    },
    {
      href: `/${role}/leads`,
      label: "Leads",
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
          />
        </svg>
      ),
    },
    ...(role === "employee" || role === "manager"
      ? [
          {
            href: `/${role}/tasks`,
            label: "Tasks",
            icon: (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"
                />
              </svg>
            ),
          },
        ]
      : []),
    {
      href: `/${role}/clients`,
      label: "Clients",
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
          />
        </svg>
      ),
    },
   
    ...(role === "admin"
      ? [
          {
            href: "/admin/user-management",
            label: "User Management",
            icon: (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z"
                />
              </svg>
            ),
            // special: true,
          },
           {
      href: `/${role}/Employees`,
      label: "Employees",
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
          />
        </svg>
      ),
    },
        ]
      : []),
    {
      href: `/${role}/change-password`,
      label: "Change Password",
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z"
          />
        </svg>
      ),
    },
  ]

  return (
    <>
      {/* Navbar */}
      <nav
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
          isScrolled
            ? "bg-gradient-to-r from-purple-900/95 via-indigo-900/95 to-violet-900/95 backdrop-blur-xl shadow-2xl shadow-purple-500/20 border-b border-purple-500/20"
            : "bg-gradient-to-r from-purple-800/90 via-indigo-800/90 to-violet-800/90 backdrop-blur-lg"
        }`}
      >
        {/* Animated background overlay */}
        <div className="absolute inset-0 bg-gradient-to-r from-purple-600/10 via-indigo-600/10 to-violet-600/10 animate-pulse"></div>

        {/* Floating particles effect */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div
            className="absolute top-2 left-1/4 w-2 h-2 bg-purple-400/30 rounded-full animate-bounce"
            style={{ animationDelay: "0s", animationDuration: "3s" }}
          ></div>
          <div
            className="absolute top-4 right-1/3 w-1 h-1 bg-indigo-400/40 rounded-full animate-bounce"
            style={{ animationDelay: "1s", animationDuration: "4s" }}
          ></div>
          <div
            className="absolute bottom-3 left-1/2 w-1.5 h-1.5 bg-violet-400/35 rounded-full animate-bounce"
            style={{ animationDelay: "2s", animationDuration: "5s" }}
          ></div>
        </div>

        <div className="relative container mx-auto px-6 py-4">
          <div className="flex justify-between items-center">
            {/* Logo Section */}
            <Link href={`/${role}/dashboard`} className="group flex items-center space-x-3 relative">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-purple-500 to-indigo-500 rounded-2xl blur-lg opacity-60 group-hover:opacity-80 transition-opacity duration-300 animate-pulse"></div>
                <div className="relative bg-gradient-to-br from-purple-600 via-indigo-600 to-violet-600 p-3 rounded-2xl shadow-xl group-hover:shadow-2xl transition-all duration-300 transform group-hover:scale-110 group-hover:rotate-3">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
              </div>
              <div className="flex flex-col">
                <h1 className="text-2xl font-bold bg-gradient-to-r from-white via-purple-100 to-indigo-100 bg-clip-text text-transparent group-hover:from-purple-200 group-hover:to-indigo-200 transition-all duration-300">
                  Phoenix CRM
                </h1>
                <span className="text-xs text-purple-200/80 font-medium tracking-wider uppercase">Solutions</span>
              </div>

              {/* Hover glow effect */}
              <div className="absolute inset-0 bg-gradient-to-r from-purple-500/20 to-indigo-500/20 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 blur-xl"></div>
            </Link>

            {/* Navigation Links */}
            <div className="hidden lg:flex items-center space-x-2">
              {navLinks.map((link, index) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`group relative flex items-center space-x-2 px-4 py-2.5 rounded-xl font-medium text-sm transition-all duration-300 transform hover:scale-105 ${
                    activeLink === link.href
                    
                        ? "bg-gradient-to-r from-purple-600/20 to-indigo-600/20 text-purple-100 hover:from-purple-500/30 hover:to-indigo-500/30 border border-purple-500/20 hover:border-purple-400/40"
                        : "text-purple-100 hover:text-white hover:bg-gradient-to-r hover:from-purple-500/20 hover:to-indigo-500/20"
                  }`}
                  style={{ animationDelay: `${index * 0.1}s` }}
                  onClick={() => setActiveLink(link.href)}
                >
                  {/* Background glow */}
                  <div className="absolute inset-0 bg-gradient-to-r from-purple-500/10 to-indigo-500/10 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 blur-sm"></div>

                  <span className="relative z-10 flex items-center space-x-2">
                    <span className="transform group-hover:scale-110 transition-transform duration-300">
                      {link.icon}
                    </span>
                    <span className="font-semibold tracking-wide">{link.label}</span>
                  </span>

                  {/* Active indicator */}
                  {activeLink === link.href && (
                    <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-1/2 h-0.5 bg-gradient-to-r from-purple-400 to-indigo-400 rounded-full"></div>
                  )}
                </Link>
              ))}

              {/* Separator */}
              <div className="h-8 w-px bg-gradient-to-b from-transparent via-purple-400/50 to-transparent mx-4"></div>

              {/* Logout Button */}
              <button
                onClick={handleLogout}
                className="group relative overflow-hidden bg-gradient-to-r from-rose-600 via-red-600 to-pink-600 hover:from-rose-700 hover:via-red-700 hover:to-pink-700 px-5 py-2.5 rounded-xl transition-all duration-300 text-sm font-semibold shadow-xl hover:shadow-2xl hover:shadow-red-500/30 transform hover:scale-105 text-white border border-red-500/30 hover:border-red-400/50"
              >
                {/* Animated background */}
                <div className="absolute inset-0 bg-gradient-to-r from-red-400/20 to-pink-400/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>

                <span className="relative z-10 flex items-center space-x-2">
                  <svg
                    className="w-4 h-4 transform group-hover:scale-110 group-hover:rotate-12 transition-all duration-300"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                    />
                  </svg>
                  <span>Logout</span>
                </span>

                {/* Ripple effect */}
                <div className="absolute inset-0 bg-white/10 rounded-xl opacity-0 group-active:opacity-100 transition-opacity duration-150"></div>
              </button>
            </div>

            {/* Mobile Menu Button */}
            <div className="lg:hidden">
              <button className="group relative p-3 bg-gradient-to-r from-purple-600/30 to-indigo-600/30 rounded-xl border border-purple-500/30 hover:from-purple-500/40 hover:to-indigo-500/40 transition-all duration-300">
                <svg
                  className="w-6 h-6 text-white group-hover:scale-110 transition-transform duration-300"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
            </div>
          </div>
        </div>

        {/* Bottom border glow */}
        <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-purple-500/50 to-transparent"></div>
      </nav>

      {/* Spacer to prevent content from hiding behind fixed navbar */}
      <div className="h-20"></div>

      <style jsx>{`
        @keyframes slideInDown {
          from {
            opacity: 0;
            transform: translateY(-20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        .animate-slideInDown {
          animation: slideInDown 0.6s ease-out forwards;
        }
      `}</style>
    </>
  )
}

