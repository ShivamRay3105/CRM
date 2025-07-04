"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Navbar from "../../components/Navbar"

interface Client {
  id: number
  name: string
  email: string
  phone: string
  company: string
  status: string
  assignedTo: string
  assignedToId?: number
  address?: string
  createdAt?: string
}

export default function EmployeeClientsPage() {
  const router = useRouter()
  const [clients, setClients] = useState<Client[]>([])
  const [statusFilter, setStatusFilter] = useState("")
  const [searchQuery, setSearchQuery] = useState("")
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    const fetchClients = async () => {
      setLoading(true)
      try {
        const token = localStorage.getItem("token")
        if (!token) {
          setError("No authentication token found. Please log in again.")
          router.push("/login")
          return
        }

        const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/clients/Employee/allClients`, {
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        })

        if (!response.ok) {
          if (response.status === 401) {
            setError("Session expired. Please log in again.")
            localStorage.removeItem("token")
            router.push("/login")
            return
          }
          if (response.status === 403) {
            setError("Access denied. You do not have permission to view clients.")
            return
          }
          throw new Error(`Failed to fetch clients: ${response.status}`)
        }

        const data = await response.json()
        setClients(data.content || [])
        setError("")
      } catch (err) {
        setError(`Error loading clients: ${(err as Error).message}`)
        console.error("Fetch clients error:", err)
      } finally {
        setLoading(false)
      }
    }

    fetchClients()
  }, [router])

  // Combined filtering for search and status
  const filteredClients = clients.filter((client) => {
    const matchesSearch =
      searchQuery === "" ||
      client.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      client.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      client.phone.toLowerCase().includes(searchQuery.toLowerCase()) ||
      client.company.toLowerCase().includes(searchQuery.toLowerCase()) ||
      client.assignedTo.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (client.address && client.address.toLowerCase().includes(searchQuery.toLowerCase())) ||
      client.status.toLowerCase().includes(searchQuery.toLowerCase())

    const matchesStatus = statusFilter === "" || client.status === statusFilter

    return matchesSearch && matchesStatus
  })

  const clearSearch = () => {
    setSearchQuery("")
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      <Navbar role="employee" />

      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-indigo-600/10 to-purple-600/10"></div>
        <div className="relative container mx-auto px-6 pt-12 pb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-indigo-800 via-purple-700 to-blue-800 bg-clip-text text-transparent mb-4">
                Client Portfolio
              </h1>
              <p className="text-lg text-slate-600 font-medium">
                Manage and track your client relationships with precision
              </p>
            </div>
            <div className="hidden md:block">
              <div className="w-24 h-24 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-xl">
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

      <div className="container mx-auto px-6 pb-12">
        {/* Error Alert */}
        {error && (
          <div className="mb-8 p-4 bg-red-50 border border-red-200 rounded-xl shadow-sm animate-pulse">
            <div className="flex items-center">
              <svg className="w-5 h-5 text-red-500 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <span className="text-red-800 font-medium">{error}</span>
            </div>
          </div>
        )}

        {/* Control Panel with Search Bar */}
        <div className="mb-8 bg-white/70 backdrop-blur-sm border border-white/20 rounded-2xl shadow-xl p-6">
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
            {/* Left side - Search Bar and Filters */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 flex-1">
              {/* Long Oval Search Bar */}
              <div className="relative group flex-1 max-w-md">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <svg
                    className="h-5 w-5 text-slate-400 group-focus-within:text-indigo-500 transition-colors duration-300"
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
                  placeholder="Search clients by name, email, company..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-12 pr-12 py-4 bg-white/90 backdrop-blur-sm border border-slate-200 rounded-full shadow-lg hover:shadow-xl focus:shadow-2xl transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-slate-800 placeholder-slate-400 font-medium group-focus-within:scale-105 transform"
                />
                {searchQuery && (
                  <button
                    onClick={clearSearch}
                    className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-400 hover:text-indigo-500 transition-colors duration-300"
                  >
                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}
              </div>

              {/* Status Filter */}
              <div className="relative">
                <select
                  className="appearance-none bg-white/90 backdrop-blur-sm border border-slate-200 rounded-xl px-6 py-3 pr-12 font-medium text-slate-700 shadow-lg hover:shadow-xl transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                >
                  <option value="">All Statuses</option>
                  <option value="ACTIVE">Active</option>
                  <option value="INACTIVE">Inactive</option>
                  <option value="ON_HOLD">On Hold</option>
                  <option value="CLOSED">Closed</option>
                </select>
                <svg
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400 pointer-events-none"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>

            {/* Right side - Results Info */}
            <div className="flex items-center gap-4">
              {searchQuery && (
                <div className="text-sm text-indigo-600 bg-indigo-50 px-4 py-2 rounded-lg font-medium border border-indigo-200">
                  {filteredClients.length} result{filteredClients.length !== 1 ? "s" : ""} for "{searchQuery}"
                </div>
              )}
              <div className="text-sm text-slate-600 bg-slate-100/80 px-4 py-2 rounded-lg font-medium">
                {filteredClients.length} {filteredClients.length === 1 ? "Client" : "Clients"}
              </div>
            </div>
          </div>
        </div>

        {/* Loading State */}
        {loading ? (
          <div className="text-center p-16 bg-white/60 backdrop-blur-sm rounded-3xl shadow-xl border border-white/20">
            <div className="relative inline-flex items-center justify-center w-16 h-16 mb-6">
              <div className="absolute inset-0 rounded-full border-4 border-indigo-200 animate-pulse"></div>
              <div className="absolute inset-0 rounded-full border-t-4 border-indigo-600 animate-spin"></div>
            </div>
            <h3 className="text-xl font-semibold text-slate-700 mb-2">Loading Your Clients</h3>
            <p className="text-slate-500">Please wait while we fetch your client data...</p>
          </div>
        ) : filteredClients.length === 0 ? (
          <div className="text-center p-16 bg-white/60 backdrop-blur-sm rounded-3xl shadow-xl border border-white/20">
            <div className="w-20 h-20 bg-gradient-to-br from-slate-200 to-slate-300 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <svg className="w-10 h-10 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-slate-700 mb-2">No Clients Found</h3>
            <p className="text-slate-500">
              {searchQuery ? (
                <>
                  No clients match your search for "<span className="font-semibold text-indigo-600">{searchQuery}</span>
                  "
                </>
              ) : statusFilter ? (
                `No clients with status "${statusFilter}" found.`
              ) : (
                "No clients available in your portfolio."
              )}
            </p>
            {(searchQuery || statusFilter) && (
              <button
                onClick={() => {
                  setSearchQuery("")
                  setStatusFilter("")
                }}
                className="mt-4 group relative overflow-hidden bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-6 py-3 rounded-xl hover:from-indigo-700 hover:to-purple-700 transition-all duration-300 shadow-xl hover:shadow-indigo-500/50 transform hover:scale-105 font-semibold"
              >
                <span className="relative z-10">Clear Filters</span>
                <div className="absolute inset-0 bg-gradient-to-r from-indigo-400 to-purple-400 opacity-0 group-hover:opacity-30 transition-opacity duration-300"></div>
              </button>
            )}
          </div>
        ) : (
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {filteredClients.map((client, index) => (
              <div
                key={client.id}
                className={`group bg-white/80 border border-white/20 rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-500 transform hover:scale-[1.02] p-6 relative overflow-hidden animate-slideInUp`}
                style={{
                  animationDelay: `${index * 100}ms`,
                  animationFillMode: "both",
                }}
              >
                {/* Decorative gradient */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-indigo-500/10 to-purple-500/10 rounded-full transform translate-x-16 -translate-y-16 group-hover:scale-150 transition-transform duration-700"></div>

                <div className="relative z-10">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h2 className="text-xl font-bold text-slate-800 mb-1 group-hover:text-indigo-700 transition-colors duration-300">
                        {client.name}
                      </h2>
                      <div className="flex items-center gap-2">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(client.status)} shadow-sm`}
                        >
                          {client.status}
                        </span>
                      </div>
                    </div>
                    <div className="w-12 h-12 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                      <svg className="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                        />
                      </svg>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center gap-3 p-3 bg-white/90 rounded-xl border border-slate-100 group-hover:bg-gradient-to-r group-hover:from-indigo-50/50 group-hover:to-purple-50/50 transition-all duration-300">
                      <svg
                        className="w-4 h-4 text-slate-500 flex-shrink-0"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                        />
                      </svg>
                      <span className="text-sm text-slate-800 font-medium truncate">{client.email}</span>
                    </div>

                    <div className="flex items-center gap-3 p-3 bg-white/90 rounded-xl border border-slate-100 group-hover:bg-gradient-to-r group-hover:from-indigo-50/50 group-hover:to-purple-50/50 transition-all duration-300">
                      <svg
                        className="w-4 h-4 text-slate-500 flex-shrink-0"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                        />
                      </svg>
                      <span className="text-sm text-slate-800 font-medium">{client.phone}</span>
                    </div>

                    <div className="flex items-center gap-3 p-3 bg-white/90 rounded-xl border border-slate-100 group-hover:bg-gradient-to-r group-hover:from-indigo-50/50 group-hover:to-purple-50/50 transition-all duration-300">
                      <svg
                        className="w-4 h-4 text-slate-500 flex-shrink-0"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                        />
                      </svg>
                      <span className="text-sm text-slate-800 font-medium truncate">{client.company}</span>
                    </div>

                    {client.address && (
                      <div className="flex items-center gap-3 p-3 bg-white/90 rounded-xl border border-slate-100 group-hover:bg-gradient-to-r group-hover:from-indigo-50/50 group-hover:to-purple-50/50 transition-all duration-300">
                        <svg
                          className="w-4 h-4 text-slate-500 flex-shrink-0"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
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
                        <span className="text-sm text-slate-800 font-medium truncate">{client.address}</span>
                      </div>
                    )}

                    <div className="flex items-center gap-3 p-3 bg-indigo-50/90 rounded-xl border border-indigo-100 group-hover:bg-gradient-to-r group-hover:from-indigo-100/80 group-hover:to-purple-100/80 transition-all duration-300">
                      <svg
                        className="w-4 h-4 text-indigo-600 flex-shrink-0"
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
                      <span className="text-sm text-indigo-800 font-semibold">{client.assignedTo}</span>
                    </div>

                    {client.createdAt && (
                      <div className="flex items-center gap-3 p-3 bg-white/90 rounded-xl border border-slate-100 group-hover:bg-gradient-to-r group-hover:from-indigo-50/50 group-hover:to-purple-50/50 transition-all duration-300">
                        <svg
                          className="w-4 h-4 text-slate-500 flex-shrink-0"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                          />
                        </svg>
                        <span className="text-sm text-slate-800 font-medium">
                          {new Date(client.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
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
        
        .animate-slideInUp {
          animation-name: slideInUp;
          animation-duration: 0.6s;
          animation-timing-function: ease-out;
        }
      `}</style>
    </div>
  )
}

function getStatusColor(status: string): string {
  switch (status) {
    case "ACTIVE":
      return "bg-emerald-100 text-emerald-800 border border-emerald-200"
    case "INACTIVE":
      return "bg-slate-100 text-slate-800 border border-slate-200"
    case "ON_HOLD":
      return "bg-amber-100 text-amber-800 border border-amber-200"
    case "CLOSED":
      return "bg-rose-100 text-rose-800 border border-rose-200"
    default:
      return "bg-slate-100 text-slate-800 border border-slate-200"
  }
}
