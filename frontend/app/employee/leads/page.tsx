"use client"

import { useState, useEffect, useMemo } from "react"
import { useRouter } from "next/navigation"
import Navbar from "@/app/components/Navbar"

interface Lead {
  id: number
  name: string
  email: string
  phone: string
  company: string
  status: string
  createdAt: string
  updatedAt: string
  assignedTo: string
  assignedToId: number
  conversionStatus: string | null
  conversionMessage: string | null
}

interface PaginatedResponse {
  content: Lead[]
  totalPages: number
  totalElements: number
  number: number
}

interface User {
  id: number
  username: string
  roles: string[]
}

export default function EmployeeLeads() {
  const router = useRouter()
  const [leads, setLeads] = useState<Lead[]>([])
  const [managerLeads, setManagerLeads] = useState<Lead[]>([])
  const [allLeads, setAllLeads] = useState<Lead[]>([]) // Store all leads for search

  // Separate pagination for personal leads
  const [personalPage, setPersonalPage] = useState(0)
  const [personalTotalPages, setPersonalTotalPages] = useState(1)

  // Separate pagination for manager leads
  const [managerPage, setManagerPage] = useState(0)
  const [managerTotalPages, setManagerTotalPages] = useState(1)

  const [statusFilter, setStatusFilter] = useState("")
  const [searchQuery, setSearchQuery] = useState("") // New search state
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [showAddModal, setShowAddModal] = useState(false)
  const [showConversionModal, setShowConversionModal] = useState(false)
  const [newLead, setNewLead] = useState({
    name: "",
    email: "",
    phone: "",
    company: "",
    status: "NEW",
  })
  const [editingLead, setEditingLead] = useState<Lead | null>(null)
  const [conversionRequest, setConversionRequest] = useState({ id: "", message: "" })
  const [employeeId, setEmployeeId] = useState<number | null>(null)
  const validStatuses = ["NEW", "CONTACTED", "QUALIFIED", "LOST"]

  const [showLeadDetailsModal, setShowLeadDetailsModal] = useState(false)
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null)

  const fetchEmployeeId = async () => {
    try {
      const token = localStorage.getItem("token")
      if (!token) throw new Error("No authentication token found")
      const response = await fetch("http://localhost:8080/api/users/me", {
        credentials: "include",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      })
      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`Fetch user failed: ${response.status} - ${errorText}`)
      }
      const data: User = await response.json()
      setEmployeeId(data.id)
      return data.id
    } catch (err) {
      console.error("Fetch employee ID error:", err)
      setError(`Failed to fetch user data: ${(err as Error).message}`)
      setLoading(false)
      throw err
    }
  }

  // Fetch all leads without pagination for search functionality
  const fetchAllLeads = async () => {
    try {
      const token = localStorage.getItem("token")
      if (!token) throw new Error("No authentication token found")

      // Fetch all leads by making multiple API calls if needed
      let allLeadsData: any[] = []
      let currentPage = 0
      let totalPages = 1

      // Keep fetching until we get all pages
      do {
        const url = `http://localhost:8080/api/Leads/myLeads?page=${currentPage}&size=50` // Increased size to reduce API calls
        const response = await fetch(url, {
          credentials: "include",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        })

        if (!response.ok) {
          const errorText = await response.text()
          throw new Error(`Leads fetch failed: ${response.status} - ${errorText}`)
        }

        const data: PaginatedResponse = await response.json()
        allLeadsData = [...allLeadsData, ...data.content]
        totalPages = data.totalPages
        currentPage++
      } while (currentPage < totalPages)

      // Map and process all leads
      const mappedLeads = allLeadsData.map((lead: any) => ({
        id: lead.id,
        name: lead.name,
        email: lead.email,
        phone: lead.phone,
        company: lead.company,
        status: lead.status,
        createdAt: lead.createdAt,
        updatedAt: lead.updatedAt,
        assignedTo: lead.assignedTo,
        assignedToId: lead.assignedToId || 0,
        conversionStatus: lead["conversion status"] || lead.conversionStatus || null,
        conversionMessage: lead["conversion message"] || lead.conversionMessage || null,
      }))

      // Remove duplicates based on ID
      const uniqueLeads = mappedLeads.filter((lead, index, self) => index === self.findIndex((l) => l.id === lead.id))

      // Store all leads for search functionality
      setAllLeads(uniqueLeads)

      console.log("Fetched all leads successfully:", {
        total: uniqueLeads.length,
      })
    } catch (err) {
      setError(`Failed to load leads: ${(err as Error).message}`)
      console.error("Fetch leads error:", err)
    }
  }

  // Filter and search leads using useMemo for performance
  const filteredLeads = useMemo(() => {
    let filtered = allLeads

    // Apply status filter
    if (statusFilter && statusFilter !== "") {
      filtered = filtered.filter((lead) => lead.status === statusFilter)
    }

    // Apply search filter
    if (searchQuery.trim() !== "") {
      const query = searchQuery.toLowerCase().trim()
      filtered = filtered.filter(
        (lead) =>
          lead.name.toLowerCase().includes(query) ||
          lead.email.toLowerCase().includes(query) ||
          (lead.phone && lead.phone.toLowerCase().includes(query)) ||
          (lead.company && lead.company.toLowerCase().includes(query)) ||
          lead.status.toLowerCase().includes(query) ||
          (lead.assignedTo && lead.assignedTo.toLowerCase().includes(query)) ||
          (lead.conversionMessage && lead.conversionMessage.toLowerCase().includes(query)),
      )
    }

    return filtered
  }, [allLeads, statusFilter, searchQuery])

  // Separate filtered leads based on conversion status
  const personalLeads = useMemo(() => {
    return filteredLeads.filter((lead) => !lead.conversionStatus || lead.conversionStatus === "PENDING")
  }, [filteredLeads])

  const reviewedLeads = useMemo(() => {
    return filteredLeads.filter((lead) => lead.conversionStatus === "CONVERTED" || lead.conversionStatus === "DENIED")
  }, [filteredLeads])

  // Paginate personal leads
  const paginatedPersonalLeads = useMemo(() => {
    const startIndex = personalPage * 10
    const endIndex = startIndex + 10
    return personalLeads.slice(startIndex, endIndex)
  }, [personalLeads, personalPage])

  // Paginate manager leads
  const paginatedManagerLeads = useMemo(() => {
    const startIndex = managerPage * 10
    const endIndex = startIndex + 10
    return reviewedLeads.slice(startIndex, endIndex)
  }, [reviewedLeads, managerPage])

  // Update leads and pagination when filtered data changes
  useEffect(() => {
    setLeads(paginatedPersonalLeads)
    setManagerLeads(paginatedManagerLeads)

    // Calculate pagination
    setPersonalTotalPages(Math.max(1, Math.ceil(personalLeads.length / 10)))
    setManagerTotalPages(Math.max(1, Math.ceil(reviewedLeads.length / 10)))
  }, [paginatedPersonalLeads, paginatedManagerLeads, personalLeads.length, reviewedLeads.length])

  // Reset to first page when search or filter changes
  useEffect(() => {
    setPersonalPage(0)
    setManagerPage(0)
  }, [searchQuery, statusFilter])

  // Initial load
  useEffect(() => {
    const initializeData = async () => {
      const token = localStorage.getItem("token")
      if (!token) {
        router.push("/login")
        return
      }

      try {
        setLoading(true)
        setError("")
        await fetchEmployeeId()
        await fetchAllLeads()
      } catch (err) {
        console.error("Initialization error:", err)
      } finally {
        setLoading(false)
      }
    }

    initializeData()
  }, [router])

  // Only refetch data on initial load and after CRUD operations
  useEffect(() => {
    if (employeeId && !searchQuery && !statusFilter && personalPage === 0 && managerPage === 0) {
      // Only refetch if we're on first page and no filters applied
      fetchAllLeads()
    }
  }, [employeeId])

  const handleCreateLead = async () => {
    if (!newLead.name.trim()) return setError("Name is required")
    if (!newLead.email.trim()) return setError("Email is required")
    if (!/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(newLead.email))
      return setError("Please enter a valid email address")
    if (newLead.phone && !/^[6-9][0-9]{9}$/.test(newLead.phone))
      return setError("Phone must be 10 digits and start with 6, 7, 8, or 9")

    try {
      const token = localStorage.getItem("token")
      if (!token) throw new Error("No authentication token found")
      const response = await fetch("http://localhost:8080/api/Leads/addLead", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        credentials: "include",
        body: JSON.stringify(newLead),
      })
      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`Create lead failed: ${response.status} - ${errorText}`)
      }
      await response.json()
      setNewLead({ name: "", email: "", phone: "", company: "", status: "NEW" })
      setShowAddModal(false)
      setError("")
      await fetchAllLeads()
    } catch (err) {
      setError(`Failed to create lead: ${(err as Error).message}`)
      console.error("Create lead error:", err)
    }
  }

  const handleUpdateLead = async () => {
    if (!editingLead) return
    if (!editingLead.name.trim()) return setError("Name is required")
    if (!editingLead.email.trim()) return setError("Email is required")
    if (!/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(editingLead.email))
      return setError("Please enter a valid email address")
    if (editingLead.phone && !/^[6-9][0-9]{9}$/.test(editingLead.phone))
      return setError("Phone must be 10 digits and start with 6, 7, 8, or 9")

    try {
      const token = localStorage.getItem("token")
      if (!token) throw new Error("No authentication token found")
      const response = await fetch(`http://localhost:8080/api/Leads/updateLead/${editingLead.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        credentials: "include",
        body: JSON.stringify({
          name: editingLead.name,
          email: editingLead.email,
          phone: editingLead.phone,
          company: editingLead.company,
          status: editingLead.status,
        }),
      })
      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`Update lead failed: ${response.status} - ${errorText}`)
      }
      const updatedLead = await response.json()
      setLeads(leads.map((lead) => (lead.id === updatedLead.id ? updatedLead : lead)))
      setManagerLeads(managerLeads.map((lead) => (lead.id === updatedLead.id ? updatedLead : lead)))
      setEditingLead(null)
      setError("")
      await fetchAllLeads()
    } catch (err) {
      setError(`Failed to update lead: ${(err as Error).message}`)
      console.error("Update lead error:", err)
    }
  }

  const handleDeleteLead = async (leadId: number) => {
    if (!confirm("Are you sure you want to delete this lead?")) return

    try {
      const token = localStorage.getItem("token")
      if (!token) throw new Error("No authentication token found")
      const response = await fetch(`http://localhost:8080/api/Leads/deleteLead/${leadId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        credentials: "include",
      })
      if (!response.ok) {
        const errorText = await response.text()
        if (response.status === 500 && errorText.includes("violates foreign key constraint")) {
          throw new Error("Cannot delete lead because it has associated tasks")
        }
        throw new Error(`Delete lead failed: ${response.status} - ${errorText}`)
      }
      setLeads(leads.filter((lead) => lead.id !== leadId))
      setManagerLeads(managerLeads.filter((lead) => lead.id !== leadId))
      setError("")
      await fetchAllLeads()
    } catch (err) {
      setError(`Failed to delete lead: ${(err as Error).message}`)
      console.error("Delete lead error:", err)
    }
  }

  const handleRequestConversion = async () => {
    if (!conversionRequest.id) return setError("Please select a lead")
    if (!conversionRequest.message.trim()) return setError("Conversion message is required")

    try {
      const token = localStorage.getItem("token")
      if (!token) throw new Error("No authentication token found")
      const response = await fetch(`http://localhost:8080/api/Leads/convert/${conversionRequest.id}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        credentials: "include",
        body: JSON.stringify({ message: conversionRequest.message }),
      })
      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`Conversion request failed: ${response.status} - ${errorText}`)
      }
      const updatedLead = await response.json()
      setLeads(leads.map((lead) => (lead.id === updatedLead.id ? updatedLead : lead)))
      setManagerLeads(managerLeads.map((lead) => (lead.id === updatedLead.id ? updatedLead : lead)))
      setConversionRequest({ id: "", message: "" })
      setShowConversionModal(false)
      setError("")
      await fetchAllLeads()
    } catch (err) {
      setError(`Failed to request conversion: ${(err as Error).message}`)
      console.error("Conversion request error:", err)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "NEW":
        return "bg-blue-100 text-blue-800 border border-blue-200"
      case "CONTACTED":
        return "bg-amber-100 text-amber-800 border border-amber-200"
      case "QUALIFIED":
        return "bg-emerald-100 text-emerald-800 border border-emerald-200"
      case "CONVERTED":
        return "bg-purple-100 text-purple-800 border border-purple-200"
      case "LOST":
        return "bg-rose-100 text-rose-800 border border-rose-200"
      default:
        return "bg-slate-100 text-slate-800 border border-slate-200"
    }
  }

  const getConversionStatusColor = (status: string | null) => {
    if (!status) return "bg-slate-100 text-slate-600 border border-slate-200"
    switch (status) {
      case "PENDING":
        return "bg-yellow-100 text-yellow-800 border border-yellow-200"
      case "CONVERTED":
        return "bg-purple-100 text-purple-800 border border-purple-200"
      case "DENIED":
        return "bg-rose-100 text-rose-800 border border-rose-200"
      default:
        return "bg-slate-100 text-slate-600 border border-slate-200"
    }
  }

  const renderEnhancedPipelineStatus = (status: string) => {
    const stages = ["NEW", "CONTACTED", "QUALIFIED", "LOST", "CONVERTED"]
    const currentIndex = stages.indexOf(status)

    return (
      <div className="bg-gradient-to-br from-indigo-50 to-purple-50 p-6 rounded-2xl border border-indigo-100 shadow-lg">
        <h4 className="text-lg font-bold text-slate-800 mb-4 text-center">Sales Pipeline Progress</h4>

        {/* Progress Bar */}
        <div className="relative mb-6">
          <div className="flex items-center justify-between">
            {stages.map((stage, index) => (
              <div key={stage} className="flex flex-col items-center relative z-10">
                <div
                  className={`w-12 h-12 rounded-full flex items-center justify-center text-sm font-bold shadow-lg transition-all duration-500 transform ${
                    index <= currentIndex
                      ? "bg-gradient-to-br from-indigo-600 to-purple-600 text-white scale-110 shadow-indigo-500/50"
                      : "bg-white text-slate-400 border-2 border-slate-200"
                  } ${index === currentIndex ? "ring-4 ring-indigo-200 animate-pulse" : ""}`}
                >
                  {index <= currentIndex ? (
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  ) : (
                    index + 1
                  )}
                </div>
                <span
                  className={`mt-2 text-xs font-semibold text-center transition-all duration-300 ${
                    index === currentIndex
                      ? "text-indigo-700 font-bold scale-110"
                      : index < currentIndex
                        ? "text-indigo-600"
                        : "text-slate-400"
                  }`}
                >
                  {stage}
                </span>
              </div>
            ))}
          </div>

          {/* Connecting Lines */}
          <div className="absolute top-6 left-0 right-0 h-1 bg-slate-200 -z-10">
            <div
              className="h-full bg-gradient-to-r from-indigo-600 to-purple-600 transition-all duration-1000 ease-out rounded-full"
              style={{ width: `${(currentIndex / (stages.length - 1)) * 100}%` }}
            />
          </div>
        </div>

        {/* Status Description */}
        <div className="text-center">
          <div
            className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-semibold ${getStatusColor(status)}`}
          >
            <div className="w-2 h-2 rounded-full bg-current mr-2 animate-pulse"></div>
            Current Status: {status}
          </div>
          <p className="text-slate-600 text-sm mt-2">
            {currentIndex === 0 && "Lead has been created and is ready for initial contact."}
            {currentIndex === 1 && "Initial contact has been made with the lead."}
            {currentIndex === 2 && "Lead has been qualified and shows potential."}
            {currentIndex === 3 && "Lead was not converted and marked as lost."}
            {currentIndex === 4 && "Lead has been successfully converted to a customer!"}
          </p>
        </div>
      </div>
    )
  }

  const renderPaginationNumbers = (currentPage: number, totalPages: number, onPageChange: (page: number) => void) => {
    const pages = []
    const maxVisiblePages = 5
    let startPage = Math.max(0, currentPage - Math.floor(maxVisiblePages / 2))
    const endPage = Math.min(totalPages - 1, startPage + maxVisiblePages - 1)

    if (endPage - startPage + 1 < maxVisiblePages) {
      startPage = Math.max(0, endPage - maxVisiblePages + 1)
    }

    for (let i = startPage; i <= endPage; i++) {
      pages.push(
        <button
          key={i}
          onClick={() => onPageChange(i)}
          className={`relative px-4 py-2 mx-1 rounded-xl font-semibold text-sm transition-all duration-300 transform hover:scale-110 shadow-lg hover:shadow-xl ${
            i === currentPage
              ? "bg-gradient-to-r from-indigo-600 to-purple-600 text-white scale-110 shadow-indigo-500/50"
              : "bg-white/90 backdrop-blur-sm text-slate-700 hover:bg-gradient-to-r hover:from-indigo-50 hover:to-purple-50 hover:text-indigo-700 border border-white/20"
          }`}
          style={{
            animationDelay: `${i * 50}ms`,
          }}
        >
          {i + 1}
          {i === currentPage && (
            <div className="absolute inset-0 bg-gradient-to-r from-indigo-400 to-purple-400 opacity-20 rounded-xl animate-pulse"></div>
          )}
        </button>,
      )
    }
    return pages
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
        <Navbar role="employee" />
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center p-16 bg-white/60 backdrop-blur-sm rounded-3xl shadow-xl border border-white/20">
            <div className="relative inline-flex items-center justify-center w-16 h-16 mb-6">
              <div className="absolute inset-0 rounded-full border-4 border-indigo-200 animate-pulse"></div>
              <div className="absolute inset-0 rounded-full border-t-4 border-indigo-600 animate-spin"></div>
            </div>
            <h3 className="text-xl font-semibold text-slate-700 mb-2">Loading Lead Data</h3>
            <p className="text-slate-500">Please wait while we fetch your leads...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <>
      {/* Backdrop blur overlay when modals are open */}
      <div
        className={`min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 transition-all duration-300 ${
          showAddModal || editingLead || showConversionModal || showLeadDetailsModal ? "blur-sm scale-95" : ""
        }`}
      >
        <Navbar role="employee" />

        {/* Hero Section */}
        <div className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-indigo-600/10 to-purple-600/10"></div>
          <div className="relative container mx-auto px-6 pt-12 pb-8">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-indigo-800 via-purple-700 to-blue-800 bg-clip-text text-transparent mb-4">
                  Employee Leads Dashboard
                </h1>
                <p className="text-lg text-slate-600 font-medium">Manage and track your sales leads efficiently</p>
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
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 w-full lg:w-auto">
                <div className="relative group">
                  <select
                    className="appearance-none bg-white/90 backdrop-blur-sm border border-slate-200 rounded-xl px-6 py-3 pr-12 font-medium text-slate-700 shadow-lg hover:shadow-xl transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent group-hover:border-indigo-300"
                    value={statusFilter}
                    onChange={(e) => {
                      setStatusFilter(e.target.value)
                      setPersonalPage(0)
                      setManagerPage(0)
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
                  <div className="absolute inset-0 rounded-xl border-2 border-indigo-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
                </div>
                <div className="text-sm text-slate-600 bg-slate-100/80 px-4 py-2 rounded-lg font-medium">
                  {personalLeads.length + reviewedLeads.length}{" "}
                  {personalLeads.length + reviewedLeads.length === 1 ? "Lead" : "Leads"}
                  {(searchQuery || statusFilter) && (
                    <span className="text-indigo-600 ml-1">(filtered from {allLeads.length} total)</span>
                  )}
                </div>
              </div>

              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 w-full lg:w-auto">
                {/* Long Oval Search Bar */}
                <div className="relative group flex-1 sm:flex-initial">
                  <div className="absolute inset-y-0 left-0 pl-6 flex items-center pointer-events-none">
                    <svg
                      className="w-5 h-5 text-slate-400 group-hover:text-indigo-500 transition-colors duration-300"
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
                    placeholder="Search leads across all pages..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full sm:w-80 lg:w-96 pl-14 pr-12 py-4 bg-white/90 backdrop-blur-sm border border-slate-200 rounded-full font-medium text-slate-700 placeholder-slate-400 shadow-lg hover:shadow-xl transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent group-hover:border-indigo-300 focus:shadow-2xl focus:scale-[1.02]"
                  />
                  <div className="absolute inset-0 rounded-full border-2 border-indigo-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery("")}
                      className="absolute inset-y-0 right-0 pr-6 flex items-center text-slate-400 hover:text-slate-600 transition-colors duration-300 hover:scale-110"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setShowConversionModal(true)}
                    className="group relative overflow-hidden bg-gradient-to-r from-green-600 to-emerald-600 text-white px-6 py-3 rounded-xl hover:from-green-700 hover:to-emerald-700 transition-all duration-300 shadow-xl hover:shadow-green-500/50 transform hover:scale-105 font-semibold"
                  >
                    <span className="relative z-10 flex items-center gap-2">
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
                          d="M13 10V3L4 14h7v7l9-11h-7z"
                        />
                      </svg>
                      Request Conversion
                    </span>
                    <div className="absolute inset-0 bg-gradient-to-r from-green-400 to-emerald-400 opacity-0 group-hover:opacity-30 transition-opacity duration-300"></div>
                  </button>
                  <button
                    onClick={() => setShowAddModal(true)}
                    className="group relative overflow-hidden bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-6 py-3 rounded-xl hover:from-indigo-700 hover:to-purple-700 transition-all duration-300 shadow-xl hover:shadow-indigo-500/50 transform hover:scale-105 font-semibold"
                  >
                    <span className="relative z-10 flex items-center gap-2">
                      <svg
                        className="w-5 h-5 group-hover:scale-110 transition-transform duration-300"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                      Add Lead
                    </span>
                    <div className="absolute inset-0 bg-gradient-to-r from-indigo-400 to-purple-400 opacity-0 group-hover:opacity-30 transition-opacity duration-300"></div>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Search Results Info */}
          {searchQuery && (
            <div className="mb-6 p-4 bg-indigo-50/80 backdrop-blur-sm border border-indigo-200 rounded-xl shadow-sm">
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
                <span className="text-indigo-800 font-medium">
                  Search results for "{searchQuery}" - Found {filteredLeads.length}{" "}
                  {filteredLeads.length === 1 ? "lead" : "leads"}
                </span>
                <button
                  onClick={() => setSearchQuery("")}
                  className="ml-auto text-indigo-600 hover:text-indigo-800 transition-colors duration-300"
                >
                  Clear search
                </button>
              </div>
            </div>
          )}

          {/* Manager Reviewed Leads */}
          {managerLeads.length > 0 && (
            <div className="mb-8 bg-white/80 backdrop-blur-sm border border-white/20 rounded-2xl shadow-xl overflow-hidden">
              <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-blue-600 p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.864-.833-2.634 0L4.182 16.5c-.77.833.192 2.5 1.732 2.5z"
                      />
                    </svg>
                    <h2 className="text-2xl font-bold text-white">Leads Denied by Manager</h2>
                  </div>
                  <div className="text-white/80 text-sm">
                    Page {managerPage + 1} of {managerTotalPages} • {paginatedManagerLeads.length} of{" "}
                    {reviewedLeads.length} leads
                  </div>
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
                        Review Status
                      </th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-slate-900 uppercase tracking-wider">
                        Manager Feedback
                      </th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-slate-900 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {managerLeads.map((lead, index) => (
                      <tr
                        key={`manager-lead-${lead.id}`}
                        className="group hover:bg-gradient-to-r hover:from-indigo-50/50 hover:to-purple-50/50 transition-all duration-500 transform hover:scale-[1.01] hover:shadow-lg cursor-pointer"
                        onClick={() => {
                          setSelectedLead(lead)
                          setShowLeadDetailsModal(true)
                        }}
                        style={{
                          animation: `slideInUp 0.6s ease-out ${index * 0.1}s both`,
                        }}
                      >
                        <td className="px-6 py-4">
                          <div className="space-y-2">
                            <div className="font-semibold text-slate-900 group-hover:text-indigo-700 transition-colors duration-300 text-lg">
                              {lead.name}
                            </div>
                            <div className="flex items-center gap-1.5">
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
                            <div className="flex items-center gap-1.5">
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
                              <span className="text-sm text-slate-700 font-medium">{lead.phone || "No phone"}</span>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="p-3 bg-gradient-to-r from-slate-100 to-slate-200 rounded-xl text-slate-800 font-semibold text-center group-hover:from-indigo-100 group-hover:to-purple-100 group-hover:text-indigo-800 transition-all duration-300 shadow-sm group-hover:shadow-md">
                            {lead.company || "No company"}
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
                          <span
                            className={`inline-flex items-center px-3 py-2 rounded-xl text-sm font-semibold shadow-sm group-hover:shadow-md transition-all duration-300 transform group-hover:scale-105 ${getConversionStatusColor(lead.conversionStatus)}`}
                          >
                            {lead.conversionStatus || "Pending"}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="p-3 bg-gradient-to-r from-slate-100 to-slate-200 rounded-xl text-slate-800 font-semibold text-center group-hover:from-indigo-100 group-hover:to-purple-100 group-hover:text-indigo-800 transition-all duration-300 shadow-sm group-hover:shadow-md">
                            {lead.conversionMessage || "No Feedback"}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                setEditingLead(lead)
                              }}
                              className="group relative overflow-hidden bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-4 py-2 rounded-xl hover:from-indigo-700 hover:to-purple-700 transition-all duration-300 transform hover:scale-105 shadow-sm hover:shadow-md font-semibold"
                            >
                              <span className="relative z-10">Edit</span>
                              <div className="absolute inset-0 bg-gradient-to-r from-indigo-400 to-purple-400 opacity-0 group-hover:opacity-30 transition-opacity duration-300"></div>
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                handleDeleteLead(lead.id)
                              }}
                              className="group relative overflow-hidden bg-gradient-to-r from-rose-600 to-red-600 text-white px-4 py-2 rounded-xl hover:from-rose-700 hover:to-red-700 transition-all duration-300 transform hover:scale-105 shadow-sm hover:shadow-md font-semibold"
                            >
                              <span className="relative z-10">Delete</span>
                              <div className="absolute inset-0 bg-gradient-to-r from-rose-400 to-red-400 opacity-0 group-hover:opacity-30 transition-opacity duration-300"></div>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Manager Leads Pagination */}
              {managerTotalPages > 1 && (
                <div className="px-6 py-4 bg-white/90 backdrop-blur-sm border-t border-slate-100 flex justify-center items-center rounded-b-2xl">
                  <button
                    onClick={() => setManagerPage((prev) => Math.max(0, prev - 1))}
                    disabled={managerPage === 0}
                    className="group relative overflow-hidden bg-white/90 backdrop-blur-sm text-slate-700 px-4 py-2 rounded-xl hover:from-indigo-50 hover:to-purple-50 hover:text-indigo-700 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105 font-semibold border border-slate-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-none"
                  >
                    <span className="relative z-10">Previous</span>
                    <div className="absolute inset-0 bg-gradient-to-r from-indigo-400 to-purple-400 opacity-0 group-hover:opacity-20 transition-opacity duration-300"></div>
                  </button>
                  <div className="flex mx-2">
                    {renderPaginationNumbers(managerPage, managerTotalPages, setManagerPage)}
                  </div>
                  <button
                    onClick={() => setManagerPage((prev) => Math.min(managerTotalPages - 1, prev + 1))}
                    disabled={managerPage === managerTotalPages - 1}
                    className="group relative overflow-hidden bg-white/90 backdrop-blur-sm text-slate-700 px-4 py-2 rounded-xl hover:from-indigo-50 hover:to-purple-50 hover:text-indigo-700 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105 font-semibold border border-slate-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-none"
                  >
                    <span className="relative z-10">Next</span>
                    <div className="absolute inset-0 bg-gradient-to-r from-indigo-400 to-purple-400 opacity-0 group-hover:opacity-20 transition-opacity duration-300"></div>
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Personal Active Leads */}
          <div className="bg-white/80 backdrop-blur-sm border border-white/20 rounded-2xl shadow-xl overflow-hidden">
            <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-blue-600 p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                    />
                  </svg>
                  <h2 className="text-2xl font-bold text-white">Your Personal Leads</h2>
                </div>
                <div className="text-white/80 text-sm">
                  Page {personalPage + 1} of {personalTotalPages} • {paginatedPersonalLeads.length} of{" "}
                  {personalLeads.length} leads
                </div>
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
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {leads.length === 0 && (
                    <tr>
                      <td colSpan={4} className="text-center py-8 text-slate-500 font-medium">
                        {searchQuery
                          ? `No leads found matching "${searchQuery}"`
                          : "No personal leads found. Add a new lead to get started!"}
                      </td>
                    </tr>
                  )}
                  {leads.map((lead, index) => (
                    <tr
                      key={`personal-lead-${lead.id}`}
                      className="group hover:bg-gradient-to-r hover:from-indigo-50/50 hover:to-purple-50/50 transition-all duration-500 transform hover:scale-[1.01] hover:shadow-lg cursor-pointer"
                      onClick={() => {
                        setSelectedLead(lead)
                        setShowLeadDetailsModal(true)
                      }}
                      style={{
                        animation: `slideInUp 0.6s ease-out ${index * 0.1}s both`,
                      }}
                    >
                      <td className="px-6 py-4">
                        <div className="space-y-2">
                          <div className="font-semibold text-slate-900 group-hover:text-indigo-700 transition-colors duration-300 text-lg">
                            {lead.name}
                          </div>
                          <div className="flex items-center gap-1.5">
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
                          <div className="flex items-center gap-1.5">
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
                            <span className="text-sm text-slate-700 font-medium">{lead.phone || "No phone"}</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="p-3 bg-gradient-to-r from-slate-100 to-slate-200 rounded-xl text-slate-800 font-semibold text-center group-hover:from-indigo-100 group-hover:to-purple-100 group-hover:text-indigo-800 transition-all duration-300 shadow-sm group-hover:shadow-md">
                          {lead.company || "No company"}
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
                        <div className="flex items-center gap-3">
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              setEditingLead(lead)
                            }}
                            className="group relative overflow-hidden bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-4 py-2 rounded-xl hover:from-indigo-700 hover:to-purple-700 transition-all duration-300 transform hover:scale-105 shadow-sm hover:shadow-md font-semibold"
                          >
                            <span className="relative z-10">Edit</span>
                            <div className="absolute inset-0 bg-gradient-to-r from-indigo-400 to-purple-400 opacity-0 group-hover:opacity-30 transition-opacity duration-300"></div>
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              handleDeleteLead(lead.id)
                            }}
                            className="group relative overflow-hidden bg-gradient-to-r from-rose-600 to-red-600 text-white px-4 py-2 rounded-xl hover:from-rose-700 hover:to-red-700 transition-all duration-300 transform hover:scale-105 shadow-sm hover:shadow-md font-semibold"
                          >
                            <span className="relative z-10">Delete</span>
                            <div className="absolute inset-0 bg-gradient-to-r from-rose-400 to-red-400 opacity-0 group-hover:opacity-30 transition-opacity duration-300"></div>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Personal Leads Pagination */}
            {personalTotalPages > 1 && (
              <div className="px-6 py-4 bg-white/90 backdrop-blur-sm border-t border-slate-100 flex justify-center items-center rounded-b-2xl">
                <button
                  onClick={() => setPersonalPage((prev) => Math.max(0, prev - 1))}
                  disabled={personalPage === 0}
                  className="group relative overflow-hidden bg-white/90 backdrop-blur-sm text-slate-700 px-4 py-2 rounded-xl hover:from-indigo-50 hover:to-purple-50 hover:text-indigo-700 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105 font-semibold border border-slate-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-none"
                >
                  <span className="relative z-10">Previous</span>
                  <div className="absolute inset-0 bg-gradient-to-r from-indigo-400 to-purple-400 opacity-0 group-hover:opacity-20 transition-opacity duration-300"></div>
                </button>
                <div className="flex mx-2">
                  {renderPaginationNumbers(personalPage, personalTotalPages, setPersonalPage)}
                </div>
                <button
                  onClick={() => setPersonalPage((prev) => Math.min(personalTotalPages - 1, prev + 1))}
                  disabled={personalPage === personalTotalPages - 1}
                  className="group relative overflow-hidden bg-white/90 backdrop-blur-sm text-slate-700 px-4 py-2 rounded-xl hover:from-indigo-50 hover:to-purple-50 hover:text-indigo-700 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105 font-semibold border border-slate-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-none"
                >
                  <span className="relative z-10">Next</span>
                  <div className="absolute inset-0 bg-gradient-to-r from-indigo-400 to-purple-400 opacity-0 group-hover:opacity-20 transition-opacity duration-300"></div>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Add Lead Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div
            className="bg-white/95 backdrop-blur-sm rounded-3xl p-8 shadow-2xl w-full max-w-md transform transition-all duration-300 scale-95 animate-slideInUp border border-white/20"
            style={{ animationFillMode: "forwards" }}
          >
            <h2 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-indigo-700 via-purple-700 to-blue-700 bg-clip-text text-transparent mb-6 text-center">
              Add New Lead
            </h2>
            {error && (
              <p className="text-red-600 text-sm mb-4 text-center bg-red-50 p-3 rounded-lg border border-red-200">
                {error}
              </p>
            )}
            <div className="space-y-4">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-900 mb-1">
                  Name
                </label>
                <input
                  type="text"
                  id="name"
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-gray-900 transition-all duration-300 shadow-sm bg-white/80 backdrop-blur-sm"
                  value={newLead.name}
                  onChange={(e) => setNewLead({ ...newLead, name: e.target.value })}
                  placeholder="Lead Name"
                />
              </div>
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-900 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  id="email"
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-gray-900 transition-all duration-300 shadow-sm bg-white/80 backdrop-blur-sm"
                  value={newLead.email}
                  onChange={(e) => setNewLead({ ...newLead, email: e.target.value })}
                  placeholder="lead@example.com"
                />
              </div>
              <div>
                <label htmlFor="phone" className="block text-sm font-medium text-gray-900 mb-1">
                  Phone
                </label>
                <input
                  type="tel"
                  id="phone"
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-gray-900 transition-all duration-300 shadow-sm bg-white/80 backdrop-blur-sm"
                  value={newLead.phone}
                  onChange={(e) => setNewLead({ ...newLead, phone: e.target.value })}
                  placeholder="e.g., 9876543210"
                />
              </div>
              <div>
                <label htmlFor="company" className="block text-sm font-medium text-gray-900 mb-1">
                  Company
                </label>
                <input
                  type="text"
                  id="company"
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-gray-900 transition-all duration-300 shadow-sm bg-white/80 backdrop-blur-sm"
                  value={newLead.company}
                  onChange={(e) => setNewLead({ ...newLead, company: e.target.value })}
                  placeholder="Company Name"
                />
              </div>
              <div>
                <label htmlFor="status" className="block text-sm font-medium text-gray-900 mb-1">
                  Status
                </label>
                <select
                  id="status"
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-gray-900 transition-all duration-300 shadow-sm bg-white/80 backdrop-blur-sm"
                  value={newLead.status}
                  onChange={(e) => setNewLead({ ...newLead, status: e.target.value })}
                >
                  {validStatuses.map((status) => (
                    <option key={status} value={status} className="text-gray-900">
                      {status}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="flex justify-end space-x-4 mt-8">
              <button
                onClick={() => {
                  setShowAddModal(false)
                  setError("")
                }}
                className="group relative overflow-hidden bg-white/90 backdrop-blur-sm text-gray-800 px-6 py-3 rounded-xl hover:bg-gray-50 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105 font-semibold border border-gray-300"
              >
                <span className="relative z-10">Cancel</span>
              </button>
              <button
                onClick={handleCreateLead}
                className="group relative overflow-hidden bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-6 py-3 rounded-xl hover:from-indigo-700 hover:to-purple-700 transition-all duration-300 shadow-xl hover:shadow-indigo-500/50 transform hover:scale-105 font-semibold"
              >
                <span className="relative z-10">Add Lead</span>
                <div className="absolute inset-0 bg-gradient-to-r from-indigo-400 to-purple-400 opacity-0 group-hover:opacity-30 transition-opacity duration-300"></div>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Lead Modal */}
      {editingLead && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div
            className="bg-white/95 backdrop-blur-sm rounded-3xl p-8 shadow-2xl w-full max-w-md transform transition-all duration-300 scale-95 animate-slideInUp border border-white/20"
            style={{ animationFillMode: "forwards" }}
          >
            <h2 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-indigo-700 via-purple-700 to-blue-700 bg-clip-text text-transparent mb-6 text-center">
              Edit Lead
            </h2>
            {error && (
              <p className="text-red-600 text-sm mb-4 text-center bg-red-50 p-3 rounded-lg border border-red-200">
                {error}
              </p>
            )}
            <div className="space-y-4">
              <div>
                <label htmlFor="edit-name" className="block text-sm font-medium text-gray-900 mb-1">
                  Name
                </label>
                <input
                  type="text"
                  id="edit-name"
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-gray-900 transition-all duration-300 shadow-sm bg-white/80 backdrop-blur-sm"
                  value={editingLead.name}
                  onChange={(e) => setEditingLead({ ...editingLead, name: e.target.value })}
                  placeholder="Lead Name"
                />
              </div>
              <div>
                <label htmlFor="edit-email" className="block text-sm font-medium text-gray-900 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  id="edit-email"
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-gray-900 transition-all duration-300 shadow-sm bg-white/80 backdrop-blur-sm"
                  value={editingLead.email}
                  onChange={(e) => setEditingLead({ ...editingLead, email: e.target.value })}
                  placeholder="lead@example.com"
                />
              </div>
              <div>
                <label htmlFor="edit-phone" className="block text-sm font-medium text-gray-900 mb-1">
                  Phone
                </label>
                <input
                  type="tel"
                  id="edit-phone"
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-gray-900 transition-all duration-300 shadow-sm bg-white/80 backdrop-blur-sm"
                  value={editingLead.phone}
                  onChange={(e) => setEditingLead({ ...editingLead, phone: e.target.value })}
                  placeholder="e.g., 9876543210"
                />
              </div>
              <div>
                <label htmlFor="edit-company" className="block text-sm font-medium text-gray-900 mb-1">
                  Company
                </label>
                <input
                  type="text"
                  id="edit-company"
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-gray-900 transition-all duration-300 shadow-sm bg-white/80 backdrop-blur-sm"
                  value={editingLead.company}
                  onChange={(e) => setEditingLead({ ...editingLead, company: e.target.value })}
                  placeholder="Company Name"
                />
              </div>
              <div>
                <label htmlFor="edit-status" className="block text-sm font-medium text-gray-900 mb-1">
                  Status
                </label>
                <select
                  id="edit-status"
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-gray-900 transition-all duration-300 shadow-sm bg-white/80 backdrop-blur-sm"
                  value={editingLead.status}
                  onChange={(e) => setEditingLead({ ...editingLead, status: e.target.value })}
                >
                  {validStatuses.map((status) => (
                    <option key={status} value={status} className="text-gray-900">
                      {status}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="flex justify-end space-x-4 mt-8">
              <button
                onClick={() => {
                  setEditingLead(null)
                  setError("")
                }}
                className="group relative overflow-hidden bg-white/90 backdrop-blur-sm text-gray-800 px-6 py-3 rounded-xl hover:bg-gray-50 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105 font-semibold border border-gray-300"
              >
                <span className="relative z-10">Cancel</span>
              </button>
              <button
                onClick={handleUpdateLead}
                className="group relative overflow-hidden bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-6 py-3 rounded-xl hover:from-indigo-700 hover:to-purple-700 transition-all duration-300 shadow-xl hover:shadow-indigo-500/50 transform hover:scale-105 font-semibold"
              >
                <span className="relative z-10">Save Changes</span>
                <div className="absolute inset-0 bg-gradient-to-r from-indigo-400 to-purple-400 opacity-0 group-hover:opacity-30 transition-opacity duration-300"></div>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Request Conversion Modal */}
      {showConversionModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div
            className="bg-white/95 backdrop-blur-sm rounded-3xl p-8 shadow-2xl w-full max-w-md transform transition-all duration-300 scale-95 animate-slideInUp border border-white/20"
            style={{ animationFillMode: "forwards" }}
          >
            <h2 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-indigo-700 via-purple-700 to-blue-700 bg-clip-text text-transparent mb-6 text-center">
              Request Lead Conversion
            </h2>
            {error && (
              <p className="text-red-600 text-sm mb-4 text-center bg-red-50 p-3 rounded-lg border border-red-200">
                {error}
              </p>
            )}
            <div className="space-y-4">
              <div>
                <label htmlFor="convert-lead" className="block text-sm font-medium text-gray-900 mb-1">
                  Select Lead
                </label>
                <select
                  id="convert-lead"
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-gray-900 transition-all duration-300 shadow-sm bg-white/80 backdrop-blur-sm"
                  value={conversionRequest.id}
                  onChange={(e) => setConversionRequest({ ...conversionRequest, id: e.target.value })}
                >
                  <option value="" className="text-gray-700">
                    -- Select a Lead --
                  </option>
                 {[...leads, ...managerLeads].map((lead) => (
  <option key={lead.id} value={lead.id} className="text-gray-900">
    {lead.name} ({lead.email})
  </option>
))}

                  
                </select>
              </div>
              <div>
                <label htmlFor="conversion-message" className="block text-sm font-medium text-gray-900 mb-1">
                  Conversion Message
                </label>
                <textarea
                  id="conversion-message"
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-gray-900 transition-all duration-300 shadow-sm resize-y bg-white/80 backdrop-blur-sm"
                  rows={4}
                  value={conversionRequest.message}
                  onChange={(e) => setConversionRequest({ ...conversionRequest, message: e.target.value })}
                  placeholder="Provide details for conversion (e.g., reason for conversion, next steps, client notes)."
                ></textarea>
              </div>
            </div>
            <div className="flex justify-end space-x-4 mt-8">
              <button
                onClick={() => {
                  setShowConversionModal(false)
                  setError("")
                }}
                className="group relative overflow-hidden bg-white/90 backdrop-blur-sm text-gray-800 px-6 py-3 rounded-xl hover:bg-gray-50 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105 font-semibold border border-gray-300"
              >
                <span className="relative z-10">Cancel</span>
              </button>
              <button
                onClick={handleRequestConversion}
                className="group relative overflow-hidden bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-6 py-3 rounded-xl hover:from-indigo-700 hover:to-purple-700 transition-all duration-300 shadow-xl hover:shadow-indigo-500/50 transform hover:scale-105 font-semibold"
              >
                <span className="relative z-10">Request Conversion</span>
                <div className="absolute inset-0 bg-gradient-to-r from-indigo-400 to-purple-400 opacity-0 group-hover:opacity-30 transition-opacity duration-300"></div>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Lead Details Modal */}
      {showLeadDetailsModal && selectedLead && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div
            className="bg-white/95 backdrop-blur-sm rounded-3xl p-6 shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto transform transition-all duration-300 scale-95 animate-slideInUp border border-white/20"
            style={{ animationFillMode: "forwards" }}
          >
            <h2 className="text-2xl font-bold bg-gradient-to-r from-indigo-700 via-purple-700 to-blue-700 bg-clip-text text-transparent mb-4 text-center">
              Lead Details: {selectedLead.name}
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div className="bg-gradient-to-r from-slate-50 to-indigo-50 p-3 rounded-xl border border-slate-200">
                <p className="text-sm font-medium text-slate-700 mb-1">ID:</p>
                <p className="text-slate-900 font-semibold">{selectedLead.id}</p>
              </div>
              <div className="bg-gradient-to-r from-slate-50 to-indigo-50 p-3 rounded-xl border border-slate-200">
                <p className="text-sm font-medium text-slate-700 mb-1">Name:</p>
                <p className="text-slate-900 font-semibold">{selectedLead.name}</p>
              </div>
              <div className="bg-gradient-to-r from-slate-50 to-indigo-50 p-3 rounded-xl border border-slate-200">
                <p className="text-sm font-medium text-slate-700 mb-1">Email:</p>
                <p className="text-slate-900 font-semibold">{selectedLead.email}</p>
              </div>
              <div className="bg-gradient-to-r from-slate-50 to-indigo-50 p-3 rounded-xl border border-slate-200">
                <p className="text-sm font-medium text-slate-700 mb-1">Phone:</p>
                <p className="text-slate-900 font-semibold">{selectedLead.phone || "N/A"}</p>
              </div>
              <div className="bg-gradient-to-r from-slate-50 to-indigo-50 p-3 rounded-xl border border-slate-200">
                <p className="text-sm font-medium text-slate-700 mb-1">Company:</p>
                <p className="text-slate-900 font-semibold">{selectedLead.company || "N/A"}</p>
              </div>
              <div className="bg-gradient-to-r from-slate-50 to-indigo-50 p-3 rounded-xl border border-slate-200">
                <p className="text-sm font-medium text-slate-700 mb-1">Status:</p>
                <span
                  className={`inline-flex items-center px-3 py-2 rounded-xl text-sm font-semibold ${getStatusColor(selectedLead.status)}`}
                >
                  {selectedLead.status}
                </span>
              </div>
              <div className="bg-gradient-to-r from-slate-50 to-indigo-50 p-3 rounded-xl border border-slate-200">
                <p className="text-sm font-medium text-slate-700 mb-1">Created At:</p>
                <p className="text-slate-900 font-semibold text-sm">
                  {new Date(selectedLead.createdAt).toLocaleString()}
                </p>
              </div>
              <div className="bg-gradient-to-r from-slate-50 to-indigo-50 p-3 rounded-xl border border-slate-200">
                <p className="text-sm font-medium text-slate-700 mb-1">Last Updated:</p>
                <p className="text-slate-900 font-semibold text-sm">
                  {new Date(selectedLead.updatedAt).toLocaleString()}
                </p>
              </div>
              <div className="col-span-1 md:col-span-2 bg-gradient-to-r from-slate-50 to-indigo-50 p-3 rounded-xl border border-slate-200">
                <p className="text-sm font-medium text-slate-700 mb-2">Conversion Status:</p>
                <span
                  className={`inline-flex items-center px-3 py-2 rounded-xl text-sm font-semibold ${getConversionStatusColor(selectedLead.conversionStatus)}`}
                >
                  {selectedLead.conversionStatus || "N/A"}
                </span>
              </div>
              {selectedLead.conversionMessage && (
                <div className="col-span-1 md:col-span-2 bg-gradient-to-r from-slate-50 to-indigo-50 p-3 rounded-xl border border-slate-200">
                  <p className="text-sm font-medium text-slate-700 mb-2">Conversion Message:</p>
                  <p className="text-slate-900 font-semibold bg-white/80 p-3 rounded-lg border border-slate-200 backdrop-blur-sm text-sm">
                    {selectedLead.conversionMessage}
                  </p>
                </div>
              )}
            </div>

            <div className="mb-6">
              <h3 className="text-lg font-bold bg-gradient-to-r from-indigo-700 to-purple-700 bg-clip-text text-transparent mb-4 text-center">
                Pipeline Progression
              </h3>
              {renderEnhancedPipelineStatus(selectedLead.status)}
            </div>

            <div className="flex justify-between items-center">
              <button
                onClick={() => {
                  setEditingLead(selectedLead)
                  setShowLeadDetailsModal(false)
                }}
                className="group relative overflow-hidden bg-gradient-to-r from-amber-600 to-orange-600 text-white px-4 py-2 rounded-xl hover:from-amber-700 hover:to-orange-700 transition-all duration-300 shadow-xl hover:shadow-amber-500/50 transform hover:scale-105 font-semibold"
              >
                <span className="relative z-10 flex items-center gap-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                    />
                  </svg>
                  Edit Lead
                </span>
              </button>

              <button
                onClick={() => {
                  setShowLeadDetailsModal(false)
                  setSelectedLead(null)
                }}
                className="group relative overflow-hidden bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-4 py-2 rounded-xl hover:from-indigo-700 hover:to-purple-700 transition-all duration-300 shadow-xl hover:shadow-indigo-500/50 transform hover:scale-105 font-semibold"
              >
                <span className="relative z-10">Close</span>
              </button>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes slideInUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }
        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out forwards;
        }
        .animate-slideInUp {
          animation: slideInUp 0.4s ease-out forwards;
        }
      `}</style>
    </>
  )
}
