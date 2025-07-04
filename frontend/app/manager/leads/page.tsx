"use client"

import { useState, useEffect } from "react"
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

interface Employee {
  id: number
  name: string
  username: string
}

interface PaginatedResponse {
  content: Lead[]
  totalPages: number
  totalElements: number
  number: number
}

interface User {
  username: string
  role: string
}

export default function ManagerLeads() {
  const router = useRouter()
  const [leads, setLeads] = useState<Lead[]>([])
  const [pendingLeads, setPendingLeads] = useState<Lead[]>([])
  const [employees, setEmployees] = useState<Employee[]>([])
  const [page, setPage] = useState(0)
  const [pendingPage, setPendingPage] = useState(0)
  const [totalPages, setTotalPages] = useState(1)
  const [totalPendingPages, setTotalPendingPages] = useState(1)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [showAddModal, setShowAddModal] = useState(false)
  const [showApproveModal, setShowApproveModal] = useState(false)
  const [showLeadDetailModal, setShowLeadDetailModal] = useState(false)
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null)
  const [newLead, setNewLead] = useState({
    name: "",
    email: "",
    phone: "",
    company: "",
    status: "NEW",
    assignedToId: "",
  })
  const [editingLead, setEditingLead] = useState<Lead | null>(null)
  const [approvingLead, setApprovingLead] = useState<Lead | null>(null)
  const [approve, setApprove] = useState(true)
  const [responseMessage, setResponseMessage] = useState("")
  const [isManager, setIsManager] = useState<boolean | null>(null)
  const [statusFilter, setStatusFilter] = useState("")
   const [searchTerm, setSearchTerm] = useState("")
  const validStatuses = ["NEW", "CONTACTED", "QUALIFIED", "LOST", "CONVERTED"]

  const checkManagerRole = async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/users/me`, {
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
      })
      if (!response.ok) {
        const errorText = await response.text()
        if (response.status === 401) {
          setError("Session expired. Please log in again.")
          router.push("/login")
          return
        }
        throw new Error(`Fetch user failed: ${response.status} - ${errorText || "No response body"}`)
      }
      const data: User = await response.json()
      console.log("User data response:", data)
      if (!data || typeof data !== "object" || !data.role) {
        throw new Error("Invalid user data received from server")
      }
      const hasManagerRole = data.role === "ROLE_MANAGER"
      setIsManager(hasManagerRole)
      if (!hasManagerRole) {
        setError("User does not have manager role. Please log in with a manager account.")
        router.push("/login")
      }
    } catch (err) {
      setError(`Failed to verify user role: ${(err as Error).message}`)
      console.error("Check manager role error:", err)
      setIsManager(false)
    }
  }

  const fetchEmployees = async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/Manager/employees`, {
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
      })
      if (!response.ok) {
        const errorText = await response.text()
        if (response.status === 401) {
          setError("Session expired. Please log in again.")
          router.push("/login")
          return
        }
        throw new Error(`Employees fetch failed: ${response.status} - ${errorText || "No response body"}`)
      }
      const data = await response.json()
      setEmployees(data || [])
    } catch (err) {
      setError(`Failed to fetch employees: ${(err as Error).message}`)
      console.error("Fetch employees error:", err)
    }
  }

const fetchLeads = async () => {
  setLoading(true)
  try {
    let allLeads: Lead[] = []
    let currentPage = 0
    let totalFetchedPages = 1

    while (currentPage < totalFetchedPages) {
      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/Manager/allLeadsOfEmployees?page=${currentPage}&size=10`, {
        credentials: "include",
        headers: { "Content-Type": "application/json" },
      })
      if (!response.ok) throw new Error(await response.text())
      const data: PaginatedResponse = await response.json()
      totalFetchedPages = data.totalPages

      allLeads = [...allLeads, ...data.content.map((lead) => ({
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
        conversionStatus: lead.conversionStatus || null,
        conversionMessage: lead.conversionMessage || null,
      }))]

      currentPage++
    }

    const filtered = allLeads.filter((lead) => {
      const matchesStatus = statusFilter ? lead.status === statusFilter : true
      const matchesSearch = searchTerm.trim() === "" ||
        lead.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        lead.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        lead.phone.includes(searchTerm) ||
        (lead.company || "").toLowerCase().includes(searchTerm.toLowerCase())
      return matchesStatus && matchesSearch
    })

    // ✅ Pagination
    const itemsPerPage = 10
    const startIndex = page * itemsPerPage
    const paginated = filtered.slice(startIndex, startIndex + itemsPerPage)

    setLeads(paginated)
    setTotalPages(Math.ceil(filtered.length / itemsPerPage))
  } catch (err) {
    setError(`Failed to load leads: ${err}`)
  } finally {
    setLoading(false)
  }
}




  const fetchPendingLeads = async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/Leads/pending?page=${pendingPage}&size=10`, {
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
      })
      if (!response.ok) {
        const errorText = await response.text()
        if (response.status === 401) {
          setError("Session expired. Please log in again.")
          router.push("/login")
          return
        }
        console.error("Pending leads fetch response:", errorText || "No response body")
        throw new Error(`Pending leads fetch failed: ${response.status} - ${errorText || "No response body"}`)
      }
      const data: PaginatedResponse = await response.json()
      const mappedLeads = data.content.map((lead: any) => ({
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
        conversionStatus: lead.conversionStatus || null,
        conversionMessage: lead.conversionMessage || null,
      }))
      setPendingLeads(mappedLeads || [])
      setTotalPendingPages(data.totalPages || 1)
    } catch (err) {
      setError(`Failed to load pending leads: ${(err as Error).message}`)
      console.error("Fetch pending leads error:", err)
    }
  }

  useEffect(() => {
     const delayDebounce = setTimeout(() => {
    checkManagerRole()
    if (isManager !== false) {
      fetchEmployees()
      fetchLeads()
      fetchPendingLeads()
    }
  }, 300) 
    return () => clearTimeout(delayDebounce)
},[page, pendingPage, statusFilter, router, isManager, searchTerm])

  const handleCreateLead = async () => {
    if (!newLead.name.trim()) return setError("Name is required")
    if (!newLead.email.trim()) return setError("Email is required")
    if (!/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(newLead.email))
      return setError("Please enter a valid email address")
    if (newLead.phone && !/^[6-9][0-9]{9}$/.test(newLead.phone))
      return setError("Phone must be 10 digits and start with 6, 7, 8, or 9")
    if (!newLead.status || !validStatuses.includes(newLead.status)) return setError("Please select a valid status")
    if (!newLead.assignedToId) return setError("Please select an employee")

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/Leads/addLead`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          name: newLead.name,
          email: newLead.email,
          phone: newLead.phone,
          company: newLead.company,
          status: newLead.status,
          assignedToId: Number(newLead.assignedToId),
        }),
      })
      if (!response.ok) {
        const errorText = await response.text()
        if (response.status === 401) {
          setError("Session expired. Please log in again.")
          router.push("/login")
          return
        }
        console.error("Create lead response:", errorText || "No response body")
        throw new Error(`Create lead failed: ${response.status} - ${errorText || "No response body"}`)
      }
      await response.json()
      setNewLead({ name: "", email: "", phone: "", company: "", status: "NEW", assignedToId: "" })
      setError("")
      setShowAddModal(false)
      await fetchLeads()
      await fetchPendingLeads()
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
    if (!editingLead.status || !validStatuses.includes(editingLead.status))
      return setError("Please select a valid status")

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/Manager/updateLeads/${editingLead.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          leadId: editingLead.id,
          name: editingLead.name,
          email: editingLead.email,
          phone: editingLead.phone,
          company: editingLead.company,
          status: editingLead.status,
          assignedToId: editingLead.assignedToId,
        }),
      })
      if (!response.ok) {
        const errorText = await response.text()
        if (response.status === 401) {
          setError("Session expired. Please log in again.")
          router.push("/login")
          return
        }
        console.error("Update lead response:", errorText || "No response body")
        throw new Error(`Update lead failed: ${response.status} - ${errorText || "No response body"}`)
      }
      await response.text()
      setLeads(leads.map((lead) => (lead.id === editingLead.id ? { ...lead, ...editingLead } : lead)))
      setEditingLead(null)
      setError("")
      await fetchLeads()
      await fetchPendingLeads()
    } catch (err) {
      setError(`Failed to update lead: ${(err as Error).message}`)
      console.error("Update lead error:", err)
    }
  }

  const handleDeleteLead = async (leadId: number) => {
    if (!confirm("Are you sure you want to delete this lead?")) return
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/Leads/deleteLead/${leadId}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
      })
      if (!response.ok) {
        const errorText = await response.text()
        if (response.status === 401) {
          setError("Session expired. Please log in again.")
          router.push("/login")
          return
        }
        if (response.status === 500 && errorText.includes("foreign key constraint")) {
          throw new Error("Cannot delete lead because it has associated tasks")
        }
        throw new Error(`Delete lead failed: ${response.status} - ${errorText || "No response body"}`)
      }
      setLeads(leads.filter((lead) => lead.id !== leadId))
      setPendingLeads(pendingLeads.filter((lead) => lead.id !== leadId))
      setError("")
      await fetchLeads()
      await fetchPendingLeads()
    } catch (err) {
      setError(`Failed to delete lead: ${(err as Error).message}`)
      console.error("Delete lead error:", err)
    }
  }

  const handleApproveConversion = async () => {
    if (!approvingLead) return
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/Leads/approve/${approvingLead.id}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          approve,
          responseMessage: approve ? "Conversion request accepted" : responseMessage || "Conversion request denied",
        }),
      })
      if (!response.ok) {
        const errorText = await response.text()
        if (response.status === 401) {
          setError("Session expired. Please log in again.")
          router.push("/login")
          return
        }
        console.error("Approve conversion response:", errorText || "No response body")
        throw new Error(`Conversion approval failed: ${response.status} - ${errorText || "No response body"}`)
      }
      const message = await response.text()
      alert(message)
      setPendingLeads(pendingLeads.filter((lead) => lead.id !== approvingLead.id))
      setApprovingLead(null)
      setResponseMessage("")
      setShowApproveModal(false)
      setError("")
      await fetchLeads()
      await fetchPendingLeads()
    } catch (err) {
      setError(`Failed to process conversion: ${(err as Error).message}`)
      console.error("Conversion approval error:", err)
    }
  }

  const handleLeadClick = (lead: Lead) => {
    setSelectedLead(lead)
    setShowLeadDetailModal(true)
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

  const renderPipelineStatus = (status: string) => {
    const stages = ["NEW", "CONTACTED", "QUALIFIED", "CONVERTED", "LOST"]
    const currentIndex = stages.indexOf(status)

    return (
      <div className="flex flex-col items-start space-y-4">
        <div className="flex items-center space-x-2">
          {stages.map((stage, index) => (
            <div key={stage} className="flex items-center">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold shadow-lg transition-all duration-300 transform hover:scale-110 ${
                  index <= currentIndex
                    ? "bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-indigo-500/50"
                    : "bg-slate-200 text-slate-500"
                }`}
              >
                {index + 1}
              </div>
              {index < stages.length - 1 && (
                <div
                  className={`w-12 h-2 rounded-full ${
                    index < currentIndex ? "bg-gradient-to-r from-indigo-600 to-purple-600" : "bg-slate-200"
                  }`}
                />
              )}
            </div>
          ))}
        </div>
        <div className="flex items-center space-x-2">
          {stages.map((stage, index) => (
            <div key={`label-${stage}`} className="flex flex-col items-center">
              <span
                className={`text-sm font-semibold transition-colors duration-300 ${
                  index === currentIndex ? "text-indigo-700 font-bold" : "text-slate-600"
                }`}
              >
                {stage}
              </span>
              {index < stages.length - 1 && <div className="w-12" />}
            </div>
          ))}
        </div>
      </div>
    )
  }

  const renderPaginationNumbers = (totalPages: number, currentPage: number, setPage: (page: number) => void) => {
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
          onClick={() => setPage(i)}
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
        <Navbar role="manager" />
        <div className="text-center p-16 bg-white/60 backdrop-blur-sm rounded-3xl shadow-xl border border-white/20 container mx-auto">
          <div className="relative inline-flex items-center justify-center w-16 h-16 mb-6">
            <div className="absolute inset-0 rounded-full border-4 border-indigo-200 animate-pulse"></div>
            <div className="absolute inset-0 rounded-full border-t-4 border-indigo-600 animate-spin"></div>
          </div>
          <h3 className="text-xl font-semibold text-slate-700 mb-2">Loading Lead Data</h3>
          <p className="text-slate-500">Please wait while we fetch your leads...</p>
        </div>
      </div>
    )
  }

  const isAnyModalOpen = showAddModal || showApproveModal || showLeadDetailModal || editingLead

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      <Navbar role="manager" />

      {/* Main Content with conditional blur */}
      <div className={`transition-all duration-300 ${isAnyModalOpen ? "blur-sm" : ""}`}>
        {/* Hero Section */}
        <div className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-indigo-600/10 to-purple-600/10"></div>
          <div className="relative container mx-auto px-6 pt-12 pb-8">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-indigo-800 via-purple-700 to-blue-800 bg-clip-text text-transparent mb-4">
                  Manager Leads Dashboard
                </h1>
                <p className="text-lg text-slate-600 font-medium">Manage and track all employee leads efficiently</p>
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
            <div className="flex flex-wrap items-center gap-4">
 <input
  type="text"
  placeholder="Search leads..."
  value={searchTerm}
  onChange={(e) => setSearchTerm(e.target.value)}
  className="px-6 py-3 rounded-full border border-slate-300 shadow-inner bg-white/90 backdrop-blur-md focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-800 font-medium transition-all duration-300 w-[500px]"
/> 
  <div className="relative group">
    <select
      className="appearance-none bg-white/90 backdrop-blur-sm border border-slate-200 rounded-xl px-6 py-3 pr-12 font-medium text-slate-700 shadow-lg hover:shadow-xl transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent group-hover:border-indigo-300"
      value={statusFilter}
      onChange={(e) => {
        setStatusFilter(e.target.value)
        setPage(0)
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
    {leads.length} {leads.length === 1 ? "Lead" : "Leads"}
  </div>
</div>

              <div className="flex space-x-3">
                <button
                  onClick={() => setShowAddModal(true)}
                  className="group relative overflow-hidden bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-8 py-4 rounded-2xl hover:from-indigo-700 hover:to-purple-700 transition-all duration-300 shadow-xl hover:shadow-indigo-500/50 transform hover:scale-105 font-bold text-lg"
                >
                  <span className="relative z-10 flex items-center gap-3">
                    <svg
                      className="w-6 h-6 group-hover:scale-110 transition-transform duration-300"
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

          {/* Pending Conversion Leads */}
          {pendingLeads.length > 0 && (
            <div className="mb-8 bg-white/80 backdrop-blur-sm border border-white/20 rounded-2xl shadow-xl overflow-hidden">
              <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-blue-600 p-6">
                <div className="flex items-center gap-3">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.864-.833-2.634 0L4.182 16.5c-.77.833.192 2.5 1.732 2.5z"
                    />
                  </svg>
                  <h2 className="text-2xl font-bold text-white">Pending Conversion Requests ({pendingLeads.length})</h2>
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
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {pendingLeads.map((lead, index) => (
                      <tr
                        key={`pending-lead-${lead.id}`}
                        className="group hover:bg-gradient-to-r hover:from-indigo-50/50 hover:to-purple-50/50 transition-all duration-500 transform hover:scale-[1.01] hover:shadow-lg cursor-pointer"
                        style={{
                          animation: `slideInUp 0.6s ease-out ${index * 0.1}s both`,
                        }}
                        onClick={() => handleLeadClick(lead)}
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
                          <div className="flex items-center gap-3">
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                setApprovingLead(lead)
                                setApprove(true)
                                setShowApproveModal(true)
                              }}
                              className="group relative overflow-hidden bg-gradient-to-r from-green-600 to-emerald-600 text-white px-6 py-3 rounded-xl hover:from-green-700 hover:to-emerald-700 transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-green-500/50 font-bold"
                            >
                              <span className="relative z-10 flex items-center gap-2">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M5 13l4 4L19 7"
                                  />
                                </svg>
                                Approve
                              </span>
                              <div className="absolute inset-0 bg-gradient-to-r from-green-400 to-emerald-400 opacity-0 group-hover:opacity-30 transition-opacity duration-300"></div>
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                setApprovingLead(lead)
                                setApprove(false)
                                setShowApproveModal(true)
                              }}
                              className="group relative overflow-hidden bg-gradient-to-r from-rose-600 to-red-600 text-white px-6 py-3 rounded-xl hover:from-rose-700 hover:to-red-700 transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-red-500/50 font-bold"
                            >
                              <span className="relative z-10 flex items-center gap-2">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M6 18L18 6M6 6l12 12"
                                  />
                                </svg>
                                Deny
                              </span>
                              <div className="absolute inset-0 bg-gradient-to-r from-rose-400 to-red-400 opacity-0 group-hover:opacity-30 transition-opacity duration-300"></div>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="bg-gradient-to-r from-slate-50 via-indigo-50 to-purple-50 px-6 py-8 border-t border-slate-200">
                <div className="flex flex-col lg:flex-row items-center justify-between gap-6">
                  <button
                    onClick={() => setPendingPage((prev) => Math.max(prev - 1, 0))}
                    disabled={pendingPage === 0}
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
                      </svg>
                      Previous
                    </span>
                    <div className="absolute inset-0 bg-gradient-to-r from-indigo-400 to-purple-400 opacity-0 group-hover:opacity-30 transition-opacity duration-300"></div>
                  </button>

                  <div className="flex items-center gap-2 bg-white/80 backdrop-blur-lg rounded-2xl p-4 shadow-xl border border-white/30">
                    {pendingPage > 2 && (
                      <>
                        <button
                          onClick={() => setPendingPage(0)}
                          className="px-4 py-2 rounded-xl bg-white/90 backdrop-blur-sm text-slate-700 hover:bg-gradient-to-r hover:from-indigo-50 hover:to-purple-50 hover:text-indigo-700 font-semibold transition-all duration-300 transform hover:scale-110 shadow-lg hover:shadow-xl border border-white/20"
                        >
                          1
                        </button>
                        {pendingPage > 3 && (
                          <span className="px-2 text-slate-500 font-semibold animate-pulse">...</span>
                        )}
                      </>
                    )}
                    {renderPaginationNumbers(totalPendingPages, pendingPage, setPendingPage)}
                    {pendingPage < totalPendingPages - 3 && (
                      <>
                        {pendingPage < totalPendingPages - 4 && (
                          <span className="px-2 text-slate-500 font-semibold animate-pulse">...</span>
                        )}
                        <button
                          onClick={() => setPendingPage(totalPendingPages - 1)}
                          className="px-4 py-2 rounded-xl bg-white/90 backdrop-blur-sm text-slate-700 hover:bg-gradient-to-r hover:from-indigo-50 hover:to-purple-50 hover:text-indigo-700 font-semibold transition-all duration-300 transform hover:scale-110 shadow-lg hover:shadow-xl border border-white/20"
                        >
                          {totalPendingPages}
                        </button>
                      </>
                    )}
                  </div>

                  <button
                    onClick={() => setPendingPage((prev) => Math.min(prev + 1, totalPendingPages - 1))}
                    disabled={pendingPage >= totalPendingPages - 1}
                    className="group relative overflow-hidden bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-8 py-4 rounded-2xl hover:from-indigo-700 hover:to-purple-700 disabled:from-slate-400 disabled:to-slate-500 disabled:cursor-not-allowed transition-all duration-300 shadow-xl hover:shadow-indigo-500/50 transform hover:scale-110 disabled:transform-none font-semibold text-lg backdrop-blur-sm"
                  >
                    <span className="relative z-10 flex items-center gap-3">
                      Next
                      <svg
                        className="w-5 h-5 group-hover:scale-110 transition-transform duration-300"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </span>
                    <div className="absolute inset-0 bg-gradient-to-r from-indigo-400 to-purple-400 opacity-0 group-hover:opacity-30 transition-opacity duration-300"></div>
                  </button>
                </div>

                <div className="mt-6 text-center">
                  <div className="inline-flex items-center gap-4 bg-white/90 backdrop-blur-lg rounded-2xl px-6 py-3 shadow-xl border border-white/30">
                    <div className="flex items-center gap-2">
                      <svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                        />
                      </svg>
                      <span className="font-semibold text-slate-800 text-lg">
                        Page {pendingPage + 1} of {totalPendingPages}
                      </span>
                    </div>
                    <div className="w-px h-6 bg-slate-300"></div>
                    <div className="flex items-center gap-2">
                      <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                        />
                      </svg>
                      <span className="font-semibold text-slate-800 text-lg">
                        {pendingLeads.length} leads displayed
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* All Leads */}
          <div className="bg-white/80 backdrop-blur-sm border border-white/20 rounded-2xl shadow-xl overflow-hidden">
            <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-blue-600 p-6">
              <div className="flex items-center gap-3">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                  />
                </svg>
                <h2 className="text-2xl font-bold text-white">All Employee Leads ({leads.length})</h2>
              </div>
            </div>

            {leads.length === 0 ? (
              <div className="text-center p-16 bg-white/60 backdrop-blur-sm rounded-3xl shadow-xl border border-white/20">
                <svg
                  className="mx-auto h-12 w-12 text-indigo-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                  />
                </svg>
                <h3 className="mt-2 text-xl font-semibold text-slate-700">No leads yet</h3>
                <p className="mt-1 text-slate-500">Get started by creating a new lead.</p>
                <div className="mt-6">
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
            ) : (
              <>
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
                        <th className="px-6 py-4 text-left text-sm font-semibold text-slate-900 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {leads.map((lead, index) => (
                        <tr
                          key={`employee-lead-${lead.id}`}
                          className="group hover:bg-gradient-to-r hover:from-indigo-50/50 hover:to-purple-50/50 transition-all duration-500 transform hover:scale-[1.01] hover:shadow-lg cursor-pointer"
                          style={{
                            animation: `slideInUp 0.6s ease-out ${index * 0.1}s both`,
                          }}
                          onClick={() => handleLeadClick(lead)}
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
                            <div className="p-3 bg-gradient-to-r from-slate-100 to-slate-200 rounded-xl text-slate-800 font-semibold text-center group-hover:from-indigo-100 group-hover:to-purple-100 group-hover:text-indigo-800 transition-all duration-300 shadow-sm group-hover:shadow-md">
                              {lead.assignedTo || "Unassigned"}
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation()
                                  setEditingLead(lead)
                                }}
                                className="group relative overflow-hidden bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-6 py-3 rounded-xl hover:from-indigo-700 hover:to-purple-700 transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-indigo-500/50 font-bold"
                              >
                                <span className="relative z-10 flex items-center gap-2">
                                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      strokeWidth={2}
                                      d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                                    />
                                  </svg>
                                  Edit
                                </span>
                                <div className="absolute inset-0 bg-gradient-to-r from-indigo-400 to-purple-400 opacity-0 group-hover:opacity-30 transition-opacity duration-300"></div>
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation()
                                  handleDeleteLead(lead.id)
                                }}
                                className="group relative overflow-hidden bg-gradient-to-r from-rose-600 to-red-600 text-white px-6 py-3 rounded-xl hover:from-rose-700 hover:to-red-700 transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-red-500/50 font-bold"
                              >
                                <span className="relative z-10 flex items-center gap-2">
                                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      strokeWidth={2}
                                      d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                                    />
                                  </svg>
                                  Delete
                                </span>
                                <div className="absolute inset-0 bg-gradient-to-r from-rose-400 to-red-400 opacity-0 group-hover:opacity-30 transition-opacity duration-300"></div>
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Enhanced Pagination */}
                <div className="bg-gradient-to-r from-slate-50 via-indigo-50 to-purple-50 px-6 py-8 border-t border-slate-200">
                  <div className="flex flex-col lg:flex-row items-center justify-between gap-6">
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
                        </svg>
                        Previous
                      </span>
                      <div className="absolute inset-0 bg-gradient-to-r from-indigo-400 to-purple-400 opacity-0 group-hover:opacity-30 transition-opacity duration-300"></div>
                    </button>

                    <div className="flex items-center gap-2 bg-white/80 backdrop-blur-lg rounded-2xl p-4 shadow-xl border border-white/30">
                      {page > 2 && (
                        <>
                          <button
                            onClick={() => setPage(0)}
                            className="px-4 py-2 rounded-xl bg-white/90 backdrop-blur-sm text-slate-700 hover:bg-gradient-to-r hover:from-indigo-50 hover:to-purple-50 hover:text-indigo-700 font-semibold transition-all duration-300 transform hover:scale-110 shadow-lg hover:shadow-xl border border-white/20"
                          >
                            1
                          </button>
                          {page > 3 && <span className="px-2 text-slate-500 font-semibold animate-pulse">...</span>}
                        </>
                      )}
                      {renderPaginationNumbers(totalPages, page, setPage)}
                      {page < totalPages - 3 && (
                        <>
                          {page < totalPages - 4 && (
                            <span className="px-2 text-slate-500 font-semibold animate-pulse">...</span>
                          )}
                          <button
                            onClick={() => setPage(totalPages - 1)}
                            className="px-4 py-2 rounded-xl bg-white/90 backdrop-blur-sm text-slate-700 hover:bg-gradient-to-r hover:from-indigo-50 hover:to-purple-50 hover:text-indigo-700 font-semibold transition-all duration-300 transform hover:scale-110 shadow-lg hover:shadow-xl border border-white/20"
                          >
                            {totalPages}
                          </button>
                        </>
                      )}
                    </div>

                    <button
                      onClick={() => setPage((prev) => Math.min(prev + 1, totalPages - 1))}
                      disabled={page >= totalPages - 1}
                      className="group relative overflow-hidden bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-8 py-4 rounded-2xl hover:from-indigo-700 hover:to-purple-700 disabled:from-slate-400 disabled:to-slate-500 disabled:cursor-not-allowed transition-all duration-300 shadow-xl hover:shadow-indigo-500/50 transform hover:scale-110 disabled:transform-none font-semibold text-lg backdrop-blur-sm"
                    >
                      <span className="relative z-10 flex items-center gap-3">
                        Next
                        <svg
                          className="w-5 h-5 group-hover:scale-110 transition-transform duration-300"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </span>
                      <div className="absolute inset-0 bg-gradient-to-r from-indigo-400 to-purple-400 opacity-0 group-hover:opacity-30 transition-opacity duration-300"></div>
                    </button>
                  </div>

                  <div className="mt-6 text-center">
                    <div className="inline-flex items-center gap-4 bg-white/90 backdrop-blur-lg rounded-2xl px-6 py-3 shadow-xl border border-white/30">
                      <div className="flex items-center gap-2">
                        <svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                          />
                        </svg>
                        <span className="font-semibold text-slate-800 text-lg">
                          Page {page + 1} of {totalPages}
                        </span>
                      </div>
                      <div className="w-px h-6 bg-slate-300"></div>
                      <div className="flex items-center gap-2">
                        <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                          />
                        </svg>
                        <span className="font-semibold text-slate-800 text-lg">{leads.length} leads displayed</span>
                      </div>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Lead Detail Modal */}
      {showLeadDetailModal && selectedLead && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md overflow-y-auto h-full w-full z-50 flex items-start justify-center p-2 md:p-4">
          <div className="relative w-full max-w-4xl bg-white/95 backdrop-blur-lg rounded-3xl shadow-2xl border border-white/30 overflow-hidden animate-in fade-in zoom-in duration-300">
            <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-blue-600 p-8">
              <div className="flex items-start justify-between">
                <h3 className="text-3xl font-bold text-white">Lead Details</h3>
                <button
                  onClick={() => {
                    setShowLeadDetailModal(false)
                    setSelectedLead(null)
                  }}
                  className="text-indigo-200 hover:text-indigo-50 transition-colors duration-300"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            <div className="p-8 max-h-[70vh] overflow-y-auto">
              {/* Contact Information */}
              <div className="mb-6">
                <h4 className="text-xl font-semibold text-slate-800 mb-3">Contact Information</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-600 mb-1">Name</label>
                    <p className="text-slate-900 font-semibold">{selectedLead.name}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-600 mb-1">Email</label>
                    <p className="text-slate-900 font-semibold">{selectedLead.email}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-600 mb-1">Phone</label>
                    <p className="text-slate-900 font-semibold">{selectedLead.phone || "No phone"}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-600 mb-1">Company</label>
                    <p className="text-slate-900 font-semibold">{selectedLead.company || "No company"}</p>
                  </div>
                </div>
              </div>

              {/* Status and Assignment */}
              <div className="mb-6">
                <h4 className="text-xl font-semibold text-slate-800 mb-3">Status & Assignment</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-600 mb-1">Current Status</label>
                    <span
                      className={`inline-flex items-center px-3 py-2 rounded-xl text-sm font-semibold ${getStatusColor(selectedLead.status)}`}
                    >
                      {selectedLead.status}
                    </span>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-600 mb-1">Assigned To</label>
                    <p className="text-slate-900 font-semibold">{selectedLead.assignedTo || "Unassigned"}</p>
                  </div>
                </div>
              </div>

              {/* Pipeline Progression */}
              <div className="mb-6">
                <h4 className="text-xl font-semibold text-slate-800 mb-4">Pipeline Progression</h4>
                {renderPipelineStatus(selectedLead.status)}
              </div>

              {/* Conversion Information */}
              {(selectedLead.conversionStatus || selectedLead.conversionMessage) && (
                <div className="mb-6">
                  <h4 className="text-xl font-semibold text-slate-800 mb-3">Conversion Information</h4>
                  <div className="space-y-3">
                    {selectedLead.conversionStatus && (
                      <div>
                        <label className="block text-sm font-medium text-slate-600 mb-1">Conversion Status</label>
                        <span
                          className={`inline-flex items-center px-3 py-2 rounded-xl text-sm font-semibold ${getConversionStatusColor(selectedLead.conversionStatus)}`}
                        >
                          {selectedLead.conversionStatus}
                        </span>
                      </div>
                    )}
                    {selectedLead.conversionMessage && (
                      <div>
                        <label className="block text-sm font-medium text-slate-600 mb-1">Conversion Message</label>
                        <p className="text-slate-900 bg-white/70 p-3 rounded-lg">{selectedLead.conversionMessage}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Timestamps */}
              <div>
                <h4 className="text-xl font-semibold text-slate-800 mb-3">Timeline</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-600 mb-1">Created At</label>
                    <p className="text-slate-900 font-semibold">{new Date(selectedLead.createdAt).toLocaleString()}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-600 mb-1">Last Updated</label>
                    <p className="text-slate-900 font-semibold">{new Date(selectedLead.updatedAt).toLocaleString()}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="bg-gradient-to-r from-slate-50 via-indigo-50 to-purple-50 p-6 border-t border-slate-200">
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => {
                    setShowLeadDetailModal(false)
                    setSelectedLead(null)
                  }}
                  className="px-6 py-3 rounded-xl font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors duration-300"
                >
                  Close
                </button>
                <button
                  onClick={() => {
                    setEditingLead(selectedLead)
                    setShowLeadDetailModal(false)
                    setSelectedLead(null)
                  }}
                  className="px-6 py-3 rounded-xl font-semibold text-white bg-indigo-600 hover:bg-indigo-700 transition-colors duration-300"
                >
                  Edit Lead
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Lead Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md overflow-y-auto h-full w-full z-50 flex items-start justify-center p-2 md:p-4">
          <div className="relative w-full max-w-2xl bg-white/95 backdrop-blur-lg rounded-3xl shadow-2xl border border-white/30 overflow-hidden animate-in fade-in zoom-in duration-300">
            <div className="flex items-center justify-between p-6 border-b border-slate-200">
              <h3 className="text-xl font-semibold text-slate-800">Add New Lead</h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-slate-500 hover:text-slate-700 transition-colors duration-300"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Name *</label>
                <input
                  type="text"
                  placeholder="Enter lead name"
                  value={newLead.name}
                  onChange={(e) => setNewLead({ ...newLead, name: e.target.value })}
                  className="group w-full px-4 py-3 border border-slate-200 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white/90 backdrop-blur-sm transition-all duration-300 text-slate-800 placeholder-slate-400 hover:bg-gradient-to-r hover:from-indigo-50/50 hover:to-purple-50/50"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Email *</label>
                <input
                  type="email"
                  placeholder="Enter email address"
                  value={newLead.email}
                  onChange={(e) => setNewLead({ ...newLead, email: e.target.value })}
                  className="group w-full px-4 py-3 border border-slate-200 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white/90 backdrop-blur-sm transition-all duration-300 text-slate-800 placeholder-slate-400 hover:bg-gradient-to-r hover:from-indigo-50/50 hover:to-purple-50/50"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Phone</label>
                <input
                  type="text"
                  placeholder="Enter phone number"
                  value={newLead.phone}
                  onChange={(e) => setNewLead({ ...newLead, phone: e.target.value })}
                  className="group w-full px-4 py-3 border border-slate-200 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white/90 backdrop-blur-sm transition-all duration-300 text-slate-800 placeholder-slate-400 hover:bg-gradient-to-r hover:from-indigo-50/50 hover:to-purple-50/50"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Company</label>
                <input
                  type="text"
                  placeholder="Enter company name"
                  value={newLead.company}
                  onChange={(e) => setNewLead({ ...newLead, company: e.target.value })}
                  className="group w-full px-4 py-3 border border-slate-200 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white/90 backdrop-blur-sm transition-all duration-300 text-slate-800 placeholder-slate-400 hover:bg-gradient-to-r hover:from-indigo-50/50 hover:to-purple-50/50"
                />
              </div>
              <div className="relative group">
                <label className="block text-sm font-medium text-slate-700 mb-2">Status</label>
                <select
                  value={newLead.status}
                  onChange={(e) => setNewLead({ ...newLead, status: e.target.value })}
                  className="appearance-none group w-full px-4 py-3 border border-slate-200 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white/90 backdrop-blur-sm transition-all duration-300 pr-12 text-slate-800 hover:bg-gradient-to-r hover:from-indigo-50/50 hover:to-purple-50/50"
                >
                  <option value="NEW">New</option>
                  <option value="CONTACTED">Contacted</option>
                  <option value="QUALIFIED">Qualified</option>
                </select>
                <svg
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400 pointer-events-none group-hover:text-indigo-500 transition-colors duration-300 group-hover:scale-110"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
              <div className="relative group">
                <label className="block text-sm font-medium text-slate-700 mb-2">Assign To Employee *</label>
                <select
                  value={newLead.assignedToId}
                  onChange={(e) => setNewLead({ ...newLead, assignedToId: e.target.value })}
                  className="appearance-none group w-full px-4 py-3 border border-slate-200 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white/90 backdrop-blur-sm transition-all duration-300 pr-12 text-slate-800 hover:bg-gradient-to-r hover:from-indigo-50/50 hover:to-purple-50/50"
                >
                  <option value="">Select Employee</option>
                  {employees.map((employee) => (
                    <option key={`employee-${employee.id}`} value={employee.id}>
                      {employee.name} (ID: {employee.id})
                    </option>
                  ))}
                </select>
                <svg
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400 pointer-events-none group-hover:text-indigo-500 transition-colors duration-300 group-hover:scale-110"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>
            <div className="flex justify-end space-x-3 p-6 border-t border-slate-200">
              <button
                onClick={() => setShowAddModal(false)}
                className="px-6 py-3 rounded-xl font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors duration-300"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateLead}
                className="px-6 py-3 rounded-xl font-semibold text-white bg-indigo-600 hover:bg-indigo-700 transition-colors duration-300"
              >
                Add Lead
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Approve/Deny Conversion Modal */}
      {showApproveModal && approvingLead && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md overflow-y-auto h-full w-full z-50 flex items-start justify-center p-2 md:p-4">
          <div className="relative w-full max-w-2xl bg-white/95 backdrop-blur-lg rounded-3xl shadow-2xl border border-white/30 overflow-hidden animate-in fade-in zoom-in duration-300">
            <div className="flex items-center justify-between p-6 border-b border-slate-200">
              <h3 className="text-xl font-semibold text-slate-800">
                {approve ? "Approve" : "Deny"} Conversion Request
              </h3>
              <button
                onClick={() => {
                  setShowApproveModal(false)
                  setApprovingLead(null)
                }}
                className="text-slate-500 hover:text-slate-700 transition-colors duration-300"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Lead Information</label>
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                  <p className="font-medium text-slate-800">{approvingLead.name}</p>
                  <p className="text-sm text-slate-600">{approvingLead.company || "No company"}</p>
                  <p className="text-sm text-slate-600">{approvingLead.email}</p>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Status</label>
                <span
                  className={`inline-flex items-center px-3 py-2 rounded-xl text-sm font-semibold ${getStatusColor(approvingLead.status)}`}
                >
                  {approvingLead.status}
                </span>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Assigned To</label>
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                  <p className="text-sm text-slate-700">{approvingLead.assignedTo || "Unassigned"}</p>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Conversion Status</label>
                <span
                  className={`inline-flex items-center px-3 py-2 rounded-xl text-sm font-semibold ${getConversionStatusColor(approvingLead.conversionStatus)}`}
                >
                  {approvingLead.conversionStatus || "None"}
                </span>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Conversion Message</label>
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                  <p className="text-sm text-slate-700">{approvingLead.conversionMessage || "No message provided"}</p>
                </div>
              </div>
              <div className="relative group">
                <label className="block text-sm font-medium text-slate-700 mb-2">Action</label>
                <select
                  value={approve ? "true" : "false"}
                  onChange={(e) => setApprove(e.target.value === "true")}
                  className="appearance-none group w-full px-4 py-3 border border-slate-200 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white/90 backdrop-blur-sm transition-all duration-300 pr-12 text-slate-800 hover:bg-gradient-to-r hover:from-indigo-50/50 hover:to-purple-50/50"
                >
                  <option value="true">Approve Conversion</option>
                  <option value="false">Deny Conversion</option>
                </select>
                <svg
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400 pointer-events-none group-hover:text-indigo-500 transition-colors duration-300 group-hover:scale-110"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
              {!approve && (
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Response Message (Optional)</label>
                  <textarea
                    rows={3}
                    placeholder="Enter reason for denial..."
                    value={responseMessage}
                    onChange={(e) => setResponseMessage(e.target.value)}
                    className="group w-full px-4 py-3 border border-slate-200 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white/90 backdrop-blur-sm transition-all duration-300 text-slate-800 placeholder-slate-400 hover:bg-gradient-to-r hover:from-indigo-50/50 hover:to-purple-50/50"
                  />
                </div>
              )}
            </div>
            <div className="flex justify-end space-x-3 p-6 border-t border-slate-200">
              <button
                onClick={() => {
                  setShowApproveModal(false)
                  setApprovingLead(null)
                }}
                className="px-6 py-3 rounded-xl font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors duration-300"
              >
                Cancel
              </button>
              <button
                onClick={handleApproveConversion}
                className="px-6 py-3 rounded-xl font-semibold text-white bg-indigo-600 hover:bg-indigo-700 transition-colors duration-300"
              >
                {approve ? "Approve" : "Deny"} Request
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Lead Modal */}
      {editingLead && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md overflow-y-auto h-full w-full z-50 flex items-start justify-center p-2 md:p-4">
          <div className="relative w-full max-w-2xl bg-white/95 backdrop-blur-lg rounded-3xl shadow-2xl border border-white/30 overflow-hidden animate-in fade-in zoom-in duration-300">
            <div className="flex items-center justify-between p-6 border-b border-slate-200">
              <h3 className="text-xl font-semibold text-slate-800">Edit Lead</h3>
              <button
                onClick={() => setEditingLead(null)}
                className="text-slate-500 hover:text-slate-700 transition-colors duration-300"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Name *</label>
                <input
                  type="text"
                  value={editingLead.name}
                  onChange={(e) => setEditingLead({ ...editingLead, name: e.target.value })}
                  className="group w-full px-4 py-3 border border-slate-200 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white/90 backdrop-blur-sm transition-all duration-300 text-slate-800 placeholder-slate-400 hover:bg-gradient-to-r hover:from-indigo-50/50 hover:to-purple-50/50"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Email *</label>
                <input
                  type="email"
                  value={editingLead.email}
                  onChange={(e) => setEditingLead({ ...editingLead, email: e.target.value })}
                  className="group w-full px-4 py-3 border border-slate-200 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white/90 backdrop-blur-sm transition-all duration-300 text-slate-800 placeholder-slate-400 hover:bg-gradient-to-r hover:from-indigo-50/50 hover:to-purple-50/50"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Phone</label>
                <input
                  type="text"
                  value={editingLead.phone}
                  onChange={(e) => setEditingLead({ ...editingLead, phone: e.target.value })}
                  className="group w-full px-4 py-3 border border-slate-200 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white/90 backdrop-blur-sm transition-all duration-300 text-slate-800 placeholder-slate-400 hover:bg-gradient-to-r hover:from-indigo-50/50 hover:to-purple-50/50"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Company</label>
                <input
                  type="text"
                  value={editingLead.company}
                  onChange={(e) => setEditingLead({ ...editingLead, company: e.target.value })}
                  className="group w-full px-4 py-3 border border-slate-200 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white/90 backdrop-blur-sm transition-all duration-300 text-slate-800 placeholder-slate-400 hover:bg-gradient-to-r hover:from-indigo-50/50 hover:to-purple-50/50"
                />
              </div>
              <div className="relative group">
                <label className="block text-sm font-medium text-slate-700 mb-2">Status</label>
                <select
                  value={editingLead.status}
                  onChange={(e) => setEditingLead({ ...editingLead, status: e.target.value })}
                  className="appearance-none group w-full px-4 py-3 border border-slate-200 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white/90 backdrop-blur-sm transition-all duration-300 pr-12 text-slate-800 hover:bg-gradient-to-r hover:from-indigo-50/50 hover:to-purple-50/50"
                >
                  <option value="NEW">New</option>
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
              </div>
              <div className="relative group">
                <label className="block text-sm font-medium text-slate-700 mb-2">Assign To Employee</label>
                <select
                  value={editingLead.assignedToId}
                  onChange={(e) =>
                    setEditingLead({
                      ...editingLead,
                      assignedToId: Number(e.target.value),
                      assignedTo: employees.find((emp) => emp.id === Number(e.target.value))?.name || "",
                    })
                  }
                  className="appearance-none group w-full px-4 py-3 border border-slate-200 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white/90 backdrop-blur-sm transition-all duration-300 pr-12 text-slate-800 hover:bg-gradient-to-r hover:from-indigo-50/50 hover:to-purple-50/50"
                >
                  <option value="">Select Employee</option>
                  {employees.map((employee) => (
                    <option key={`employee-${employee.id}`} value={employee.id}>
                      {employee.name} (ID: {employee.id})
                    </option>
                  ))}
                </select>
                <svg
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400 pointer-events-none group-hover:text-indigo-500 transition-colors duration-300 group-hover:scale-110"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>
            <div className="flex justify-end space-x-3 p-6 border-t border-slate-200">
              <button
                onClick={() => setEditingLead(null)}
                className="px-6 py-3 rounded-xl font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors duration-300"
              >
                Cancel
              </button>
              <button
                onClick={handleUpdateLead}
                className="px-6 py-3 rounded-xl font-semibold text-white bg-indigo-600 hover:bg-indigo-700 transition-colors duration-300"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

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
      `}</style>
    </div>
  )
}

