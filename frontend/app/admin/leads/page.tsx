// admin leads page
"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import Navbar from "../../components/Navbar"

interface Lead {
  id: number
  name: string
  email: string
  phone: string
  company: string
  status: string
  conversionStatus?: string
  conversionMessage?: string
  createdAt: string
  updatedAt: string
  assignedTo: string
  assignedToId: number
}

interface PaginatedResponse {
  content: Lead[]
  totalPages: number
  totalElements: number
  number: number
}

export default function AdminLeads() {
  const router = useRouter()
  const [allLeads, setAllLeads] = useState<Lead[]>([]) // Store all leads for client-side search
  const [leads, setLeads] = useState<Lead[]>([]) // Leads displayed on the current page
  const [page, setPage] = useState(0)
  const [totalPages, setTotalPages] = useState(1)
  const [statusFilter, setStatusFilter] = useState("")
  const [searchTerm, setSearchTerm] = useState("") // New state for search term
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  // Function to fetch all leads for client-side filtering
  const fetchAllLeads = useCallback(async () => {
    setLoading(true)
    try {
      // Fetch all leads without pagination to enable comprehensive search
      const url = `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/admin/allLeads?size=9999` // A large size to fetch all
      const response = await fetch(url, {
        credentials: "include",
      })

      if (!response.ok) throw new Error(`All leads fetch failed: ${response.status}`)

      const data: PaginatedResponse = await response.json()
      setAllLeads(data.content || [])
    } catch (err) {
      setError(`Failed to load all leads for search: ${(err as Error).message}`)
      console.error("Fetch all leads error:", err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    const token = localStorage.getItem("token")
    if (!token) {
      router.push("/login")
      return
    }

    fetchAllLeads() // Fetch all leads on component mount
  }, [router, fetchAllLeads])

  useEffect(() => {
    // Filter leads based on status and search term
    let filteredLeads = allLeads

    if (statusFilter) {
      filteredLeads = filteredLeads.filter((lead) => lead.status === statusFilter)
    }

    if (searchTerm) {
      const lowerCaseSearchTerm = searchTerm.toLowerCase()
      filteredLeads = filteredLeads.filter(
        (lead) =>
          lead.name.toLowerCase().includes(lowerCaseSearchTerm) ||
          lead.email.toLowerCase().includes(lowerCaseSearchTerm) ||
          lead.phone.toLowerCase().includes(lowerCaseSearchTerm) ||
          lead.company.toLowerCase().includes(lowerCaseSearchTerm) ||
          lead.assignedTo.toLowerCase().includes(lowerCaseSearchTerm) ||
          lead.status.toLowerCase().includes(lowerCaseSearchTerm),
      )
    }

    // Apply pagination to the filtered leads
    const leadsPerPage = 10
    const start = page * leadsPerPage
    const end = start + leadsPerPage
    setLeads(filteredLeads.slice(start, end))
    setTotalPages(Math.ceil(filteredLeads.length / leadsPerPage))
  }, [allLeads, page, statusFilter, searchTerm]) // Re-run effect when these dependencies change

  const getStatusColor = (status: string): string => {
    switch (status) {
      case "NEW":
        return "bg-blue-100 text-blue-800 border border-blue-200"
      case "CONTACTED":
        return "bg-amber-100 text-amber-800 border border-amber-200"
      case "QUALIFIED":
        return "bg-emerald-100 text-emerald-800 border border-emerald-200"
      case "LOST":
        return "bg-rose-100 text-rose-800 border border-rose-200"
      default:
        return "bg-slate-100 text-slate-800 border border-slate-200"
    }
  }

  const getConversionStatusColor = (status?: string): string => {
    if (!status) return "bg-slate-100 text-slate-600 border border-slate-200"
    return "bg-purple-100 text-purple-800 border border-purple-200"
  }

  const renderPaginationNumbers = () => {
    const pages = []
    const maxVisiblePages = 5
    let startPage = Math.max(0, page - Math.floor(maxVisiblePages / 2))
    const endPage = Math.min(totalPages - 1, startPage + maxVisiblePages - 1)

    if (endPage - startPage + 1 < maxVisiblePages) {
      startPage = Math.max(0, endPage - maxVisiblePages + 1)
    }

    for (let i = startPage; i <= endPage; i++) {
      pages.push(
        <button
          key={i}
          onClick={() => setPage(i)}
          className={`relative px-4 py-2 mx-1 rounded-xl font-semibold text-sm transition-all duration-300 transform hover:scale-110 shadow-lg hover:shadow-xl ${
            i === page
              ? "bg-gradient-to-r from-indigo-600 to-purple-600 text-white scale-110 shadow-indigo-500/50"
              : "bg-white/90 backdrop-blur-sm text-slate-700 hover:bg-gradient-to-r hover:from-indigo-50 hover:to-purple-50 hover:text-indigo-700 border border-white/20"
          }`}
          style={{
            animationDelay: `${i * 50}ms`,
          }}
        >
          {i + 1}
          {i === page && (
            <div className="absolute inset-0 bg-gradient-to-r from-indigo-400 to-purple-400 opacity-20 rounded-xl animate-pulse"></div>
          )}
        </button>,
      )
    }
    return pages
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      <Navbar role="admin" />

      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-indigo-600/10 to-purple-600/10"></div>
        <div className="relative container mx-auto px-6 pt-12 pb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-indigo-800 via-purple-700 to-blue-800 bg-clip-text text-transparent mb-4">
                Lead Management Dashboard
              </h1>
              <p className="text-lg text-slate-600 font-medium">
                Track and manage all leads across your sales pipeline
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

        {/* Control Panel */}
        <div className="mb-8 bg-white/70 backdrop-blur-sm border border-white/20 rounded-2xl shadow-xl p-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            {/* Search Bar */}
            <div className="relative flex-grow mr-4">
              <input
                type="text"
                placeholder="Search leads..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value)
                  setPage(0) // Reset to first page on search
                }}
                className="w-full pl-12 pr-4 py-3 rounded-full bg-white/90 backdrop-blur-sm border border-slate-200 font-medium text-slate-700 shadow-lg hover:shadow-xl transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent group-hover:border-indigo-300"
                style={{
                  boxShadow: "0 4px 14px 0 rgba(0, 0, 0, 0.1)",
                  borderRadius: "9999px", // Oval shape
                  background: "linear-gradient(to right, #ffffff, #f0f0ff)", // Subtle gradient
                }}
              />
              <svg
                className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400"
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
              {/* Purple effect on focus/hover */}
              <div className="absolute inset-0 rounded-full border-2 border-transparent group-focus-within:border-purple-500 group-hover:border-purple-300 transition-all duration-300 pointer-events-none"></div>
            </div>

            <div className="flex items-center gap-4">
              {/* Status Filter */}
              <div className="relative group">
                <select
                  className="appearance-none bg-white/90 backdrop-blur-sm border border-slate-200 rounded-xl px-6 py-3 pr-12 font-medium text-slate-700 shadow-lg hover:shadow-xl transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent group-hover:border-indigo-300"
                  value={statusFilter}
                  onChange={(e) => {
                    setStatusFilter(e.target.value)
                    setPage(0) // Reset to first page on filter change
                  }}
                >
                  <option value="">All Statuses</option>
                  <option value="NEW">New Leads</option>
                  <option value="CONTACTED">Contacted</option>
                  <option value="QUALIFIED">Qualified</option>
                  <option value="LOST">Lost</option>
                </select>
                <svg
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400 pointer-events-none group-hover:text-indigo-500 transition-colors duration-300 group-hover:scale-110"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
                {/* Animated border effect */}
                <div className="absolute inset-0 rounded-xl border-2 border-indigo-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
              </div>

              <div className="text-sm text-slate-600 bg-slate-100/80 px-4 py-2 rounded-lg font-medium">
                {leads.length} {leads.length === 1 ? "Lead" : "Leads"} displayed
              </div>
            </div>
          </div>
        </div>

        {/* Loading State */}
        {loading && allLeads.length === 0 ? ( // Only show full loading if no leads are loaded yet
          <div className="text-center p-16 bg-white/60 backdrop-blur-sm rounded-3xl shadow-xl border border-white/20">
            <div className="relative inline-flex items-center justify-center w-16 h-16 mb-6">
              <div className="absolute inset-0 rounded-full border-4 border-indigo-200 animate-pulse"></div>
              <div className="absolute inset-0 rounded-full border-t-4 border-indigo-600 animate-spin"></div>
            </div>
            <h3 className="text-xl font-semibold text-slate-700 mb-2">Loading Lead Data</h3>
            <p className="text-slate-500">Please wait while we fetch all lead records...</p>
          </div>
        ) : (
          <>
            {/* Enhanced Table */}
            <div className="bg-white/80 backdrop-blur-sm border border-white/20 rounded-2xl shadow-xl overflow-hidden">
              <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-blue-600 p-6">
                <div className="flex items-center gap-3">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    />
                  </svg>
                  <h2 className="text-2xl font-bold text-white">Leads Database</h2>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-gradient-to-r from-slate-50 to-indigo-50 border-b border-slate-200">
                      <th className="px-6 py-4 text-left text-sm font-semibold text-slate-900 uppercase tracking-wider">
                        Contact Information
                      </th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-slate-900 uppercase tracking-wider">
                        Company
                      </th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-slate-900 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-slate-900 uppercase tracking-wider">
                        Assigned To
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {leads.length > 0 ? (
                      leads.map((lead, index) => (
                        <tr
                          key={lead.id}
                          className="group hover:bg-gradient-to-r hover:from-indigo-50/50 hover:to-purple-50/50 transition-all duration-500 transform hover:scale-[1.01] hover:shadow-lg cursor-pointer"
                          style={{
                            animation: `slideInUp 0.6s ease-out ${index * 0.1}s both`,
                          }}
                        >
                          <td className="px-6 py-4">
                            <div className="space-y-2">
                              <div className="font-semibold text-slate-900 group-hover:text-indigo-700 transition-colors duration-300 text-lg">
                                {lead.name}
                              </div>
                              <div className="flex items-center gap-1.5 ">
                                <svg
                                  className="w-4 h-4 text-slate-500 group-hover:text-indigo-600 transition-colors duration-300"
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
                                <span className="text-sm text-slate-700 font-medium">{lead.email}</span>
                              </div>
                              <div className="flex items-center gap-1.5 ">
                                <svg
                                  className="w-4 h-4 text-slate-500 group-hover:text-indigo-600 transition-colors duration-300"
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
                                <span className="text-sm text-slate-700 font-medium">{lead.phone}</span>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="p-3 bg-gradient-to-r from-slate-100 to-slate-200 rounded-xl text-slate-800 font-semibold text-center group-hover:from-indigo-100 group-hover:to-purple-100 group-hover:text-indigo-800 transition-all duration-300 shadow-sm group-hover:shadow-md">
                              {lead.company}
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <span
                              className={`inline-flex items-center px-3 py-2 rounded-xl text-sm font-semibold shadow-sm group-hover:shadow-md transition-all duration-300 transform group-hover:scale-105 ${getStatusColor(lead.status)}`}
                            >
                              {lead.status}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3 p-3 bg-indigo-50/90 rounded-xl border border-indigo-100 group-hover:bg-indigo-100 group-hover:border-indigo-200 transition-all duration-300">
                              <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-lg group-hover:scale-110 transition-transform duration-300">
                                {lead.assignedTo.charAt(0).toUpperCase()}
                              </div>
                              <span className="font-semibold text-indigo-800">{lead.assignedTo}</span>
                            </div>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={4} className="text-center py-8 text-slate-500 font-medium">
                          No leads found matching your criteria.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Enhanced Professional Pagination */}
              <div className="bg-gradient-to-r from-slate-50 via-indigo-50 to-purple-50 px-6 py-8 border-t border-slate-200">
                <div className="flex flex-col lg:flex-row items-center justify-between gap-6">
                  {/* Previous Button */}
                  <button
                    onClick={() => setPage((prev) => Math.max(prev - 1, 0))}
                    disabled={page === 0}
                    className="group relative overflow-hidden bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-8 py-4 rounded-2xl hover:from-indigo-700 hover:to-purple-700 disabled:from-slate-400 disabled:to-slate-500 disabled:cursor-not-allowed transition-all duration-300 shadow-xl hover:shadow-indigo-500/50 transform hover:scale-110 disabled:transform-none font-semibold text-lg backdrop-blur-sm"
                  >
                    <span className="relative z-10 flex items-center gap-3">
                      <svg
                        className="w-5 h-5 group-hover:scale-110 transition-transform duration-300"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                      </svg>{" "}
                      Previous{" "}
                    </span>
                    <div className="absolute inset-0 bg-gradient-to-r from-indigo-400 to-purple-400 opacity-0 group-hover:opacity-30 transition-opacity duration-300"></div>
                  </button>

                  {/* Page Numbers */}
                  <div className="flex items-center gap-2 bg-white/80 backdrop-blur-lg rounded-2xl p-4 shadow-xl border border-white/30">
                    {page > 2 && (
                      <>
                        <button
                          onClick={() => setPage(0)}
                          className="px-4 py-2 rounded-xl bg-white/90 backdrop-blur-sm text-slate-700 hover:bg-gradient-to-r hover:from-indigo-50 hover:to-purple-50 hover:text-indigo-700 font-semibold transition-all duration-300 transform hover:scale-110 shadow-lg hover:shadow-xl border border-white/20"
                        >
                          {" "}
                          1{" "}
                        </button>
                        {page > 3 && <span className="px-2 text-slate-500 font-semibold animate-pulse">...</span>}
                      </>
                    )}
                    {renderPaginationNumbers()}
                    {page < totalPages - 3 && (
                      <>
                        {page < totalPages - 4 && (
                          <span className="px-2 text-slate-500 font-semibold animate-pulse">...</span>
                        )}
                        <button
                          onClick={() => setPage(totalPages - 1)}
                          className="px-4 py-2 rounded-xl bg-white/90 backdrop-blur-sm text-slate-700 hover:bg-gradient-to-r hover:from-indigo-50 hover:to-purple-50 hover:text-indigo-700 font-semibold transition-all duration-300 transform hover:scale-110 shadow-lg hover:shadow-xl border border-white/20"
                        >
                          {" "}
                          {totalPages}{" "}
                        </button>
                      </>
                    )}
                  </div>

                  {/* Next Button */}
                  <button
                    onClick={() => setPage((prev) => Math.min(prev + 1, totalPages - 1))}
                    disabled={page >= totalPages - 1}
                    className="group relative overflow-hidden bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-8 py-4 rounded-2xl hover:from-indigo-700 hover:to-purple-700 disabled:from-slate-400 disabled:to-slate-500 disabled:cursor-not-allowed transition-all duration-300 shadow-xl hover:shadow-indigo-500/50 transform hover:scale-110 disabled:transform-none font-semibold text-lg backdrop-blur-sm"
                  >
                    <span className="relative z-10 flex items-center gap-3">
                      {" "}
                      Next{" "}
                      <svg
                        className="w-5 h-5 group-hover:scale-110 transition-transform duration-300"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>{" "}
                    </span>
                    <div className="absolute inset-0 bg-gradient-to-r from-indigo-400 to-purple-400 opacity-0 group-hover:opacity-30 transition-opacity duration-300"></div>
                  </button>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
