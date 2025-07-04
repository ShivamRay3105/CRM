"use client"

import type React from "react"
import { useEffect, useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import Navbar from "@/app/components/Navbar"

export default function UserManagement() {
  const router = useRouter()
  const [role, setRole] = useState("")
  const [activeTab, setActiveTab] = useState("employee")
  const [isVisible, setIsVisible] = useState(false)

  const [user, setUser] = useState({
    name: "",
    email: "",
    phoneNumber: "",
    address: "",
    username: "",
    password: "",
    position: "",
    department: "",
    // managerId: "",
    // managerId: "" as string | number,
    // managerId: null as number | null,
    managerId: "" as any,

      roles: [] as string[],
  })
  interface Manager {
  id: number
  name: string
  email: string
  roles: string[]
}


  const [message, setMessage] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  // const [managers, setManagers] = useState([]);
  const [managers, setManagers] = useState<Manager[]>([])

  useEffect(() => {
  const fetchManagers = async () => {
    try {
      const token = localStorage.getItem("token")
      const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/admin/getAllEmployees`, {
        headers: { Authorization: `Bearer ${token}` },
        credentials: "include",
      })
      const data = await res.json()

      const allEmployees = Array.isArray(data) ? data : data.content || []

      const filtered = allEmployees.filter((user: Manager) =>
        user.roles?.some(role => role.includes("MANAGER"))
      )

      setManagers(filtered)
    } catch (err) {
      console.error("Error loading managers", err)
    }
  }

  fetchManagers()
}, [])

  useEffect(() => {
    setIsVisible(true)
    fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/users/me`, {
      credentials: "include",
    })
      .then((res) => res.json())
      .then((data) => {
        setRole(data.role)
      })
      .catch((err) => {
        console.error("Error fetching user role:", err)
        router.push("/login")
      })
  }, [router])

const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
  const { name, value } = e.target
  setUser(prev => ({
    ...prev,
    [name]: name === "managerId" ? Number(value) : value
  }))
}


  const handleSubmit = async (endpoint: string) => {
    setLoading(true)
    setMessage("")
    setError("")

    const dataToSend = { ...user }
    if (endpoint !== "addEmployee") {
      delete (dataToSend as any).managerId
    }

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/admin/${endpoint}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(dataToSend),
      })

      if (!res.ok) {
        const text = await res.text()
        throw new Error(`Failed to add user: ${res.status}\n${text}`)
      }

      const result = await res.json()
      setMessage(`${endpoint.replace("add", "")} added successfully!`)
      setUser({
        name: "",
        email: "",
        phoneNumber: "",
        address: "",
        username: "",
        password: "",
        position: "",
        department: "",
        managerId: "",
         roles: [],
      })
    } catch (err) {
      console.error(err)
      setError((err as Error).message)
    } finally {
      setLoading(false)
    }
  }

  const resetForm = useCallback(() => {
    setUser({
      name: "",
      email: "",
      phoneNumber: "",
      address: "",
      username: "",
      password: "",
      position: "",
      department: "",
      managerId: null,
       roles: [],
    })
    setMessage("")
    setError("")
  }, [])

  const handleTabChange = useCallback(
    (value: string) => {
      setActiveTab(value)
      resetForm()
    },
    [resetForm],
  )

  const handleBackToDashboard = () => {
    router.push("/admin/dashboard")
  }

  if (role !== "ROLE_ADMIN") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50 to-indigo-100 flex items-center justify-center p-4 relative overflow-hidden">
        {/* Animated Background Elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-red-300/20 rounded-full blur-3xl animate-pulse"></div>
          <div
            className="absolute bottom-1/4 right-1/3 w-48 h-48 bg-rose-300/20 rounded-full blur-3xl animate-pulse"
            style={{ animationDelay: "2s" }}
          ></div>
        </div>

        <div className="relative bg-white/90 backdrop-blur-xl border border-white/30 rounded-3xl shadow-2xl shadow-red-500/20 p-8 max-w-md w-full text-center animate-in fade-in zoom-in duration-500">
          <div className="w-20 h-20 bg-gradient-to-br from-red-500 to-rose-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-xl">
            <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
              />
            </svg>
          </div>
          <h2 className="text-3xl font-bold bg-gradient-to-r from-red-800 to-rose-800 bg-clip-text text-transparent mb-4">
            Access Denied
          </h2>
          <p className="text-slate-700 font-medium text-lg mb-6">Only administrators can access this page.</p>
          <button
            onClick={() => router.push("/login")}
            className="group relative overflow-hidden bg-gradient-to-r from-red-600 to-rose-600 text-white px-6 py-3 rounded-xl hover:from-red-700 hover:to-rose-700 transition-all duration-300 shadow-xl hover:shadow-red-500/50 transform hover:scale-105 font-semibold"
          >
            <span className="relative z-10">Return to Login</span>
            <div className="absolute inset-0 bg-gradient-to-r from-red-400 to-rose-400 opacity-0 group-hover:opacity-30 transition-opacity duration-300"></div>
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50 to-indigo-100 relative overflow-hidden">
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
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(15)].map((_, i) => (
          <div
            key={i}
            className="absolute w-2 h-2 bg-purple-400/30 rounded-full animate-bounce"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 5}s`,
              animationDuration: `${3 + Math.random() * 4}s`,
            }}
          ></div>
        ))}
      </div>

      <Navbar role="admin" />

      <div
        className={`container mx-auto  pb-12 transition-all duration-1000 transform ${isVisible ? "translate-y-0 opacity-100" : "translate-y-10 opacity-0"}`}
      >
        {/* Hero Section */}
        <div className="relative overflow-hidden mb-8">
          <div className="absolute inset-0 bg-gradient-to-r from-purple-600/10 to-indigo-600/10"></div>
          <div className="relative container mx-auto px-6 pt-12 pb-8">
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-2xl flex items-center justify-center shadow-xl">
                    <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z"
                      />
                    </svg>
                  </div>
                  <div>
                    <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-purple-800 via-indigo-700 to-blue-800 bg-clip-text text-transparent">
                      User Management Portal
                    </h1>
                    <p className="text-lg text-slate-600 font-medium mt-2">
                      Add and manage users across your organization
                    </p>
                  </div>
                </div>
              </div>
              <div className="hidden md:block">
                <div className="w-24 h-24 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-2xl flex items-center justify-center shadow-xl">
                  <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                    />
                  </svg>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Main Card */}
        <div className="max-w-5xl mx-auto">
          <div className="bg-white/80 backdrop-blur-xl border border-white/30 rounded-3xl shadow-2xl shadow-purple-500/20 overflow-hidden">
            {/* Header */}
            <div className="bg-gradient-to-r from-purple-600 via-indigo-600 to-violet-600 p-8">
              <div className="text-center">
                <h2 className="text-3xl font-bold text-white mb-2">Create New User</h2>
                <p className="text-white/80 font-medium text-lg">
                  Select the user type and fill in the required information
                </p>
              </div>
            </div>

            <div className="p-8">
              {/* Tab Navigation */}
              <div className="flex gap-4 mb-8 bg-gradient-to-r from-slate-100 to-purple-100 p-4 rounded-2xl shadow-inner">
                <button
                  onClick={() => handleTabChange("employee")}
                  className={`group relative flex-1 flex items-center justify-center gap-3 py-4 px-6 rounded-2xl font-bold text-lg transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl ${
                    activeTab === "employee"
                      ? "bg-gradient-to-r from-green-600 to-emerald-600 text-white shadow-green-500/50"
                      : "bg-white/90 backdrop-blur-sm text-slate-700 hover:bg-gradient-to-r hover:from-green-50 hover:to-emerald-50 hover:text-green-700 border border-white/20"
                  }`}
                >
                  <div className="w-8 h-8 bg-white/20 rounded-xl flex items-center justify-center">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                      />
                    </svg>
                  </div>
                  Add Employee
                  {activeTab !== "employee" && (
                    <div className="absolute inset-0 bg-gradient-to-r from-green-400 to-emerald-400 opacity-0 group-hover:opacity-20 transition-opacity duration-300 rounded-2xl"></div>
                  )}
                </button>

                <button
                  onClick={() => handleTabChange("manager")}
                  className={`group relative flex-1 flex items-center justify-center gap-3 py-4 px-6 rounded-2xl font-bold text-lg transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl ${
                    activeTab === "manager"
                      ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-blue-500/50"
                      : "bg-white/90 backdrop-blur-sm text-slate-700 hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50 hover:text-blue-700 border border-white/20"
                  }`}
                >
                  <div className="w-8 h-8 bg-white/20 rounded-xl flex items-center justify-center">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2-2v2m8 0V6a2 2 0 012 2v6a2 2 0 01-2 2H6a2 2 0 01-2-2V8a2 2 0 012-2V6"
                      />
                    </svg>
                  </div>
                  Add Manager
                  {activeTab !== "manager" && (
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-indigo-400 opacity-0 group-hover:opacity-20 transition-opacity duration-300 rounded-2xl"></div>
                  )}
                </button>

                <button
                  onClick={() => handleTabChange("admin")}
                  className={`group relative flex-1 flex items-center justify-center gap-3 py-4 px-6 rounded-2xl font-bold text-lg transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl ${
                    activeTab === "admin"
                      ? "bg-gradient-to-r from-purple-600 to-violet-600 text-white shadow-purple-500/50"
                      : "bg-white/90 backdrop-blur-sm text-slate-700 hover:bg-gradient-to-r hover:from-purple-50 hover:to-violet-50 hover:text-purple-700 border border-white/20"
                  }`}
                >
                  <div className="w-8 h-8 bg-white/20 rounded-xl flex items-center justify-center">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.031 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                      />
                    </svg>
                  </div>
                  Add Admin
                  {activeTab !== "admin" && (
                    <div className="absolute inset-0 bg-gradient-to-r from-purple-400 to-violet-400 opacity-0 group-hover:opacity-20 transition-opacity duration-300 rounded-2xl"></div>
                  )}
                </button>
              </div>

              {/* Form Fields */}
              <div className="space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Full Name */}
                  <div className="space-y-3">
                    <label htmlFor="name" className="flex items-center gap-2 text-sm font-bold text-slate-800">
                      <svg className="w-4 h-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                        />
                      </svg>
                      Full Name
                    </label>
                    <div className="relative group">
                      <input
                        id="name"
                        name="name"
                        type="text"
                        placeholder="Enter full name"
                        value={user.name}
                        onChange={handleChange}
                        className={`w-full px-4 py-4 border border-slate-200 rounded-2xl shadow-sm focus:outline-none focus:ring-2 focus:border-transparent bg-white/90 backdrop-blur-sm transition-all duration-300 text-slate-800 placeholder-slate-400 hover:bg-gradient-to-r hover:from-purple-50/50 hover:to-indigo-50/50 group-focus-within:shadow-lg group-focus-within:shadow-purple-500/20 ${
                          activeTab === "employee"
                            ? "focus:ring-green-500"
                            : activeTab === "manager"
                              ? "focus:ring-blue-500"
                              : "focus:ring-purple-500"
                        }`}
                      />
                      <div
                        className={`absolute inset-0 rounded-2xl border-2 opacity-0 group-focus-within:opacity-100 transition-opacity duration-300 pointer-events-none ${
                          activeTab === "employee"
                            ? "border-green-500"
                            : activeTab === "manager"
                              ? "border-blue-500"
                              : "border-purple-500"
                        }`}
                      ></div>
                    </div>
                  </div>

                  {/* Email */}
                  <div className="space-y-3">
                    <label htmlFor="email" className="flex items-center gap-2 text-sm font-bold text-slate-800">
                      <svg className="w-4 h-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                        />
                      </svg>
                      Email Address
                    </label>
                    <div className="relative group">
                      <input
                        id="email"
                        name="email"
                        type="email"
                        placeholder="Enter email address"
                        value={user.email}
                        onChange={handleChange}
                        className={`w-full px-4 py-4 border border-slate-200 rounded-2xl shadow-sm focus:outline-none focus:ring-2 focus:border-transparent bg-white/90 backdrop-blur-sm transition-all duration-300 text-slate-800 placeholder-slate-400 hover:bg-gradient-to-r hover:from-purple-50/50 hover:to-indigo-50/50 group-focus-within:shadow-lg group-focus-within:shadow-purple-500/20 ${
                          activeTab === "employee"
                            ? "focus:ring-green-500"
                            : activeTab === "manager"
                              ? "focus:ring-blue-500"
                              : "focus:ring-purple-500"
                        }`}
                      />
                      <div
                        className={`absolute inset-0 rounded-2xl border-2 opacity-0 group-focus-within:opacity-100 transition-opacity duration-300 pointer-events-none ${
                          activeTab === "employee"
                            ? "border-green-500"
                            : activeTab === "manager"
                              ? "border-blue-500"
                              : "border-purple-500"
                        }`}
                      ></div>
                    </div>
                  </div>

                  {/* Phone Number */}
                  <div className="space-y-3">
                    <label htmlFor="phoneNumber" className="flex items-center gap-2 text-sm font-bold text-slate-800">
                      <svg className="w-4 h-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                        />
                      </svg>
                      Phone Number
                    </label>
                    <div className="relative group">
                      <input
                        id="phoneNumber"
                        name="phoneNumber"
                        type="text"
                        placeholder="Enter phone number"
                        value={user.phoneNumber}
                        onChange={handleChange}
                        className={`w-full px-4 py-4 border border-slate-200 rounded-2xl shadow-sm focus:outline-none focus:ring-2 focus:border-transparent bg-white/90 backdrop-blur-sm transition-all duration-300 text-slate-800 placeholder-slate-400 hover:bg-gradient-to-r hover:from-purple-50/50 hover:to-indigo-50/50 group-focus-within:shadow-lg group-focus-within:shadow-purple-500/20 ${
                          activeTab === "employee"
                            ? "focus:ring-green-500"
                            : activeTab === "manager"
                              ? "focus:ring-blue-500"
                              : "focus:ring-purple-500"
                        }`}
                      />
                      <div
                        className={`absolute inset-0 rounded-2xl border-2 opacity-0 group-focus-within:opacity-100 transition-opacity duration-300 pointer-events-none ${
                          activeTab === "employee"
                            ? "border-green-500"
                            : activeTab === "manager"
                              ? "border-blue-500"
                              : "border-purple-500"
                        }`}
                      ></div>
                    </div>
                  </div>

                  {/* Address */}
                  <div className="space-y-3">
                    <label htmlFor="address" className="flex items-center gap-2 text-sm font-bold text-slate-800">
                      <svg className="w-4 h-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                        />
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                        />
                      </svg>
                      Address
                    </label>
                    <div className="relative group">
                      <input
                        id="address"
                        name="address"
                        type="text"
                        placeholder="Enter address"
                        value={user.address}
                        onChange={handleChange}
                        className={`w-full px-4 py-4 border border-slate-200 rounded-2xl shadow-sm focus:outline-none focus:ring-2 focus:border-transparent bg-white/90 backdrop-blur-sm transition-all duration-300 text-slate-800 placeholder-slate-400 hover:bg-gradient-to-r hover:from-purple-50/50 hover:to-indigo-50/50 group-focus-within:shadow-lg group-focus-within:shadow-purple-500/20 ${
                          activeTab === "employee"
                            ? "focus:ring-green-500"
                            : activeTab === "manager"
                              ? "focus:ring-blue-500"
                              : "focus:ring-purple-500"
                        }`}
                      />
                      <div
                        className={`absolute inset-0 rounded-2xl border-2 opacity-0 group-focus-within:opacity-100 transition-opacity duration-300 pointer-events-none ${
                          activeTab === "employee"
                            ? "border-green-500"
                            : activeTab === "manager"
                              ? "border-blue-500"
                              : "border-purple-500"
                        }`}
                      ></div>
                    </div>
                  </div>

                  {/* Username */}
                  <div className="space-y-3">
                    <label htmlFor="username" className="flex items-center gap-2 text-sm font-bold text-slate-800">
                      <svg className="w-4 h-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M5.121 17.804A13.937 13.937 0 0112 16c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0zm6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                      Username
                    </label>
                    <div className="relative group">
                      <input
                        id="username"
                        name="username"
                        type="text"
                        placeholder="Enter username"
                        value={user.username}
                        onChange={handleChange}
                        className={`w-full px-4 py-4 border border-slate-200 rounded-2xl shadow-sm focus:outline-none focus:ring-2 focus:border-transparent bg-white/90 backdrop-blur-sm transition-all duration-300 text-slate-800 placeholder-slate-400 hover:bg-gradient-to-r hover:from-purple-50/50 hover:to-indigo-50/50 group-focus-within:shadow-lg group-focus-within:shadow-purple-500/20 ${
                          activeTab === "employee"
                            ? "focus:ring-green-500"
                            : activeTab === "manager"
                              ? "focus:ring-blue-500"
                              : "focus:ring-purple-500"
                        }`}
                      />
                      <div
                        className={`absolute inset-0 rounded-2xl border-2 opacity-0 group-focus-within:opacity-100 transition-opacity duration-300 pointer-events-none ${
                          activeTab === "employee"
                            ? "border-green-500"
                            : activeTab === "manager"
                              ? "border-blue-500"
                              : "border-purple-500"
                        }`}
                      ></div>
                    </div>
                  </div>

                  {/* Password */}
                  <div className="space-y-3">
                    <label htmlFor="password" className="flex items-center gap-2 text-sm font-bold text-slate-800">
                      <svg className="w-4 h-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                        />
                      </svg>
                      Password
                    </label>
                    <div className="relative group">
                      <input
                        id="password"
                        name="password"
                        type="password"
                        placeholder="Enter password"
                        value={user.password}
                        onChange={handleChange}
                        className={`w-full px-4 py-4 border border-slate-200 rounded-2xl shadow-sm focus:outline-none focus:ring-2 focus:border-transparent bg-white/90 backdrop-blur-sm transition-all duration-300 text-slate-800 placeholder-slate-400 hover:bg-gradient-to-r hover:from-purple-50/50 hover:to-indigo-50/50 group-focus-within:shadow-lg group-focus-within:shadow-purple-500/20 ${
                          activeTab === "employee"
                            ? "focus:ring-green-500"
                            : activeTab === "manager"
                              ? "focus:ring-blue-500"
                              : "focus:ring-purple-500"
                        }`}
                      />
                      <div
                        className={`absolute inset-0 rounded-2xl border-2 opacity-0 group-focus-within:opacity-100 transition-opacity duration-300 pointer-events-none ${
                          activeTab === "employee"
                            ? "border-green-500"
                            : activeTab === "manager"
                              ? "border-blue-500"
                              : "border-purple-500"
                        }`}
                      ></div>
                    </div>
                  </div>

                  {/* Position */}
                  <div className="space-y-3">
                    <label htmlFor="position" className="flex items-center gap-2 text-sm font-bold text-slate-800">
                      <svg className="w-4 h-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2-2v2m8 0V6a2 2 0 012 2v6a2 2 0 01-2 2H6a2 2 0 01-2-2V8a2 2 0 012-2V6"
                        />
                      </svg>
                      Position
                    </label>
                    <div className="relative group">
                      <input
                        id="position"
                        name="position"
                        type="text"
                        placeholder="Enter position"
                        value={user.position}
                        onChange={handleChange}
                        className={`w-full px-4 py-4 border border-slate-200 rounded-2xl shadow-sm focus:outline-none focus:ring-2 focus:border-transparent bg-white/90 backdrop-blur-sm transition-all duration-300 text-slate-800 placeholder-slate-400 hover:bg-gradient-to-r hover:from-purple-50/50 hover:to-indigo-50/50 group-focus-within:shadow-lg group-focus-within:shadow-purple-500/20 ${
                          activeTab === "employee"
                            ? "focus:ring-green-500"
                            : activeTab === "manager"
                              ? "focus:ring-blue-500"
                              : "focus:ring-purple-500"
                        }`}
                      />
                      <div
                        className={`absolute inset-0 rounded-2xl border-2 opacity-0 group-focus-within:opacity-100 transition-opacity duration-300 pointer-events-none ${
                          activeTab === "employee"
                            ? "border-green-500"
                            : activeTab === "manager"
                              ? "border-blue-500"
                              : "border-purple-500"
                        }`}
                      ></div>
                    </div>
                  </div>

                  {/* Department */}
                  <div className="space-y-3">
                    <label htmlFor="department" className="flex items-center gap-2 text-sm font-bold text-slate-800">
                      <svg className="w-4 h-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                        />
                      </svg>
                      Department
                    </label>
                    <div className="relative group">
                      <input
                        id="department"
                        name="department"
                        type="text"
                        placeholder="Enter department"
                        value={user.department}
                        onChange={handleChange}
                        className={`w-full px-4 py-4 border border-slate-200 rounded-2xl shadow-sm focus:outline-none focus:ring-2 focus:border-transparent bg-white/90 backdrop-blur-sm transition-all duration-300 text-slate-800 placeholder-slate-400 hover:bg-gradient-to-r hover:from-purple-50/50 hover:to-indigo-50/50 group-focus-within:shadow-lg group-focus-within:shadow-purple-500/20 ${
                          activeTab === "employee"
                            ? "focus:ring-green-500"
                            : activeTab === "manager"
                              ? "focus:ring-blue-500"
                              : "focus:ring-purple-500"
                        }`}
                      />
                      <div
                        className={`absolute inset-0 rounded-2xl border-2 opacity-0 group-focus-within:opacity-100 transition-opacity duration-300 pointer-events-none ${
                          activeTab === "employee"
                            ? "border-green-500"
                            : activeTab === "manager"
                              ? "border-blue-500"
                              : "border-purple-500"
                        }`}
                      ></div>
                    </div>
                  </div>

                  {/* Manager ID - Only for Employee */}
                  {/* {activeTab === "employee" && (
                    <div className="md:col-span-2 space-y-3">
                      <label htmlFor="managerId" className="flex items-center gap-2 text-sm font-bold text-slate-800">
                        <svg className="w-4 h-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M5.121 17.804A13.937 13.937 0 0112 16c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0zm6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                          />
                        </svg>
                        Manager ID <span className="text-sm text-slate-600 font-normal">(Optional)</span>
                      </label>
                      <div className="relative group">
                        <input
                          id="managerId"
                          name="managerId"
                          type="number"
                          placeholder="Enter manager ID (optional)"
                          value={user.managerId}
                          onChange={handleChange}
                          className="w-full px-4 py-4 border border-slate-200 rounded-2xl shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white/90 backdrop-blur-sm transition-all duration-300 text-slate-800 placeholder-slate-400 hover:bg-gradient-to-r hover:from-purple-50/50 hover:to-indigo-50/50 group-focus-within:shadow-lg group-focus-within:shadow-green-500/20"
                        />
                        <div className="absolute inset-0 rounded-2xl border-2 border-green-500 opacity-0 group-focus-within:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
                      </div>
                    </div>
                  )} */}
                {activeTab === "employee" && (
  <div className="md:col-span-2 space-y-3">
    <label htmlFor="managerId" className="flex items-center gap-2 text-sm font-bold text-slate-800">
      <svg className="w-4 h-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M5.121 17.804A13.937 13.937 0 0112 16c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0zm6 2a9 9 0 11-18 0 9 9 0 0118 0z"
        />
      </svg>
      Manager <span className="text-sm text-slate-600 font-normal">(Optional)</span>
    </label>
    <div className="relative group">
      {/* <select
        id="managerId"
        name="managerId"
        value={user.managerId}
        onChange={handleChange}
        className="w-full px-4 py-4 border border-slate-200 rounded-2xl shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white/90 backdrop-blur-sm transition-all duration-300 text-slate-800 placeholder-slate-400 hover:bg-gradient-to-r hover:from-purple-50/50 hover:to-indigo-50/50 group-focus-within:shadow-lg group-focus-within:shadow-green-500/20"
      >
        <option value="">Select manager (optional)</option>
        {managers.map((manager) => (
          <option key={manager.id} value={manager.id}>
            {manager.name} ({manager.email})
          </option>
        ))}
      </select> */}
      <select
  id="managerId"
  name="managerId"
  value={user.managerId}
  onChange={handleChange}
  className="w-full px-4 py-4 border border-slate-200 rounded-2xl shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white/90 backdrop-blur-sm transition-all duration-300 text-slate-800 placeholder-slate-400 hover:bg-gradient-to-r hover:from-purple-50/50 hover:to-indigo-50/50 group-focus-within:shadow-lg group-focus-within:shadow-green-500/20"
>
  <option value="">Select manager (optional)</option>
  {managers.map((manager) => (
    <option key={manager.id} value={manager.id}>
      {manager.name} ({manager.email})
    </option>
  ))}
</select>

      <div className="absolute inset-0 rounded-2xl border-2 border-green-500 opacity-0 group-focus-within:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
    </div>
  </div>
)}


                </div>

                {/* Submit Button */}
                <div className="pt-6">
                  {activeTab === "employee" && (
                    <button
                      onClick={() => handleSubmit("addEmployee")}
                      disabled={loading}
                      className="group relative w-full overflow-hidden bg-gradient-to-r from-green-600 to-emerald-600 text-white py-5 px-6 rounded-2xl hover:from-green-700 hover:to-emerald-700 transition-all duration-300 shadow-2xl hover:shadow-green-500/50 transform hover:scale-[1.02] disabled:opacity-70 disabled:cursor-not-allowed disabled:transform-none font-bold text-xl"
                    >
                      <span className="relative z-10 flex items-center justify-center gap-3">
                        {loading ? (
                          <>
                            <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                            Adding Employee...
                          </>
                        ) : (
                          <>
                            <svg
                              className="w-6 h-6 group-hover:scale-110 transition-transform duration-300"
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
                            Add Employee
                          </>
                        )}
                      </span>
                      <div className="absolute inset-0 bg-gradient-to-r from-green-400 to-emerald-400 opacity-0 group-hover:opacity-30 transition-opacity duration-300"></div>
                    </button>
                  )}

                  {activeTab === "manager" && (
                    <button
                      onClick={() => handleSubmit("addManager")}
                      disabled={loading}
                      className="group relative w-full overflow-hidden bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-5 px-6 rounded-2xl hover:from-blue-700 hover:to-indigo-700 transition-all duration-300 shadow-2xl hover:shadow-blue-500/50 transform hover:scale-[1.02] disabled:opacity-70 disabled:cursor-not-allowed disabled:transform-none font-bold text-xl"
                    >
                      <span className="relative z-10 flex items-center justify-center gap-3">
                        {loading ? (
                          <>
                            <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                            Adding Manager...
                          </>
                        ) : (
                          <>
                            <svg
                              className="w-6 h-6 group-hover:scale-110 transition-transform duration-300"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2-2v2m8 0V6a2 2 0 012 2v6a2 2 0 01-2 2H6a2 2 0 01-2-2V8a2 2 0 012-2V6"
                              />
                            </svg>
                            Add Manager
                          </>
                        )}
                      </span>
                      <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-indigo-400 opacity-0 group-hover:opacity-30 transition-opacity duration-300"></div>
                    </button>
                  )}

                  {activeTab === "admin" && (
                    <button
                      onClick={() => handleSubmit("addAdmin")}
                      disabled={loading}
                      className="group relative w-full overflow-hidden bg-gradient-to-r from-purple-600 to-violet-600 text-white py-5 px-6 rounded-2xl hover:from-purple-700 hover:to-violet-700 transition-all duration-300 shadow-2xl hover:shadow-purple-500/50 transform hover:scale-[1.02] disabled:opacity-70 disabled:cursor-not-allowed disabled:transform-none font-bold text-xl"
                    >
                      <span className="relative z-10 flex items-center justify-center gap-3">
                        {loading ? (
                          <>
                            <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                            Adding Admin...
                          </>
                        ) : (
                          <>
                            <svg
                              className="w-6 h-6 group-hover:scale-110 transition-transform duration-300"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.031 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                              />
                            </svg>
                            Add Admin
                          </>
                        )}
                      </span>
                      <div className="absolute inset-0 bg-gradient-to-r from-purple-400 to-violet-400 opacity-0 group-hover:opacity-30 transition-opacity duration-300"></div>
                    </button>
                  )}
                </div>
              </div>

              {/* Success/Error Messages */}
              {message && (
                <div className="mt-8 p-6 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-2xl shadow-lg animate-in fade-in slide-in-from-top duration-500">
                  <div className="flex items-center justify-center gap-3">
                    <div className="w-8 h-8 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full flex items-center justify-center">
                      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <p className="text-green-900 font-bold text-lg">{message}</p>
                  </div>
                </div>
              )}

              {error && (
                <div className="mt-8 p-6 bg-gradient-to-r from-red-50 to-rose-50 border border-red-200 rounded-2xl shadow-lg animate-in fade-in slide-in-from-top duration-500">
                  <div className="flex items-center justify-center gap-3">
                    <div className="w-8 h-8 bg-gradient-to-r from-red-500 to-rose-500 rounded-full flex items-center justify-center">
                      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </div>
                    <p className="text-red-900 font-bold text-lg">{error}</p>
                  </div>
                </div>
              )}
            </div>
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


