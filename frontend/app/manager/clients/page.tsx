"use client"

import type React from "react"

import { useEffect, useState, useMemo } from "react"
import Navbar from "@/app/components/Navbar"

// --- Embedded GlobalSearchBar Component (Oval Shape Only) ---
interface GlobalSearchBarProps {
  onSearchChange: (searchTerm: string) => void
  searchPlaceholder?: string
}

const GlobalSearchBar = ({ onSearchChange, searchPlaceholder = "Search all items..." }: GlobalSearchBarProps) => {
  const [searchTerm, setSearchTerm] = useState("")

  // Debounced search effect: calls onSearchChange after a delay
  useEffect(() => {
    const timer = setTimeout(() => {
      onSearchChange(searchTerm)
    }, 300) // 300ms debounce delay

    // Cleanup function to clear the timer if the component unmounts or searchTerm changes again
    return () => clearTimeout(timer)
  }, [searchTerm, onSearchChange]) // Re-run effect when searchTerm or onSearchChange changes

  return (
    <div className="relative group w-full">
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
        className="w-full pl-10 pr-4 py-3 sm:pl-12 sm:pr-4 sm:py-4 border border-slate-200 rounded-full shadow-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white/90 backdrop-blur-sm transition-all duration-300 text-slate-800 placeholder-slate-400 hover:bg-gradient-to-r hover:from-purple-50/50 hover:to-indigo-50/50 group-focus-within:shadow-lg group-focus-within:shadow-purple-500/20"
      />
      {searchTerm && (
        <button
          onClick={() => setSearchTerm("")}
          className="absolute inset-y-0 right-0 pr-3 sm:pr-4 flex items-center text-slate-400 hover:text-purple-600 transition-colors duration-300"
          aria-label="Clear search input"
        >
          <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      )}
      <div className="absolute inset-0 rounded-full border-2 border-purple-500 opacity-0 group-focus-within:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
    </div>
  )
}

interface Client {
  id: number
  name: string
  email: string
  phone: string
  company: string
  status: string
  address?: string
  createdAt?: string
  assignedTo: {
    id: number
    name: string
    email: string
    phoneNumber: string
    position: string
  }
}

export default function ManagerClientsPage() {
  const [clients, setClients] = useState<Client[]>([])
  const [statusFilter, setStatusFilter] = useState("")
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [editingClient, setEditingClient] = useState<Client | null>(null)
  const [editForm, setEditForm] = useState({
    name: "",
    email: "",
    phone: "",
    company: "",
    status: "",
    address: "",
  })

  // State to store the current search term from the GlobalSearchBar
  const [currentSearchTerm, setCurrentSearchTerm] = useState("")

  useEffect(() => {
    const fetchClients = async () => {
      setLoading(true)
      try {
        const token = localStorage.getItem("token")
        if (!token) {
          setError("No authentication token found. Please log in again.")
          window.location.href = "/login"
          return
        }

        const response = await fetch("http://localhost:8080/api/clients/Manager/allClientsOfEmployees", {
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
            window.location.href = "/login"
            return
          }
          if (response.status === 403) {
            setError("Access denied. You do not have permission to view these clients.")
            return
          }
          throw new Error(`Failed to fetch clients: ${response.status}`)
        }

        const data = await response.json()
        const clientsData = Array.isArray(data) ? data : data && Array.isArray(data.content) ? data.content : []
        setClients(clientsData)
        setError("")
      } catch (err) {
        setError(`Error loading clients: ${(err as Error).message}`)
        console.error("Fetch clients error:", err)
        setClients([])
      } finally {
        setLoading(false)
      }
    }

    fetchClients()
  }, [])

  // Callback function passed to GlobalSearchBar
  const handleSearch = (searchTerm: string) => {
    setCurrentSearchTerm(searchTerm)
  }

  // Combined filtering logic using useMemo for performance
  const finalFilteredClients = useMemo(() => {
    // First, apply the status filter
    const statusFiltered = statusFilter ? clients.filter((client) => client.status === statusFilter) : clients

    // Then, apply the global search filter to the status-filtered results
    if (!currentSearchTerm) {
      return statusFiltered
    }

    const lowerCaseSearchTerm = currentSearchTerm.toLowerCase()

    return statusFiltered.filter((client) => {
      return (
        client.name.toLowerCase().includes(lowerCaseSearchTerm) ||
        client.email.toLowerCase().includes(lowerCaseSearchTerm) ||
        client.phone.includes(lowerCaseSearchTerm) ||
        client.company.toLowerCase().includes(lowerCaseSearchTerm) ||
        client.id.toString().includes(lowerCaseSearchTerm) ||
        (client.address && client.address.toLowerCase().includes(lowerCaseSearchTerm)) ||
        (client.assignedTo &&
          client.assignedTo.name &&
          client.assignedTo.name.toLowerCase().includes(lowerCaseSearchTerm)) ||
        (client.assignedTo &&
          client.assignedTo.email &&
          client.assignedTo.email.toLowerCase().includes(lowerCaseSearchTerm)) ||
        (client.assignedTo &&
          client.assignedTo.phoneNumber &&
          client.assignedTo.phoneNumber.includes(lowerCaseSearchTerm)) ||
        (client.assignedTo &&
          client.assignedTo.position &&
          client.assignedTo.position.toLowerCase().includes(lowerCaseSearchTerm))
      )
    })
  }, [clients, statusFilter, currentSearchTerm])

  const handleEditClick = (client: Client) => {
    setEditingClient(client)
    setEditForm({
      name: client.name,
      email: client.email,
      phone: client.phone,
      company: client.company,
      status: client.status,
      address: client.address || "",
    })
  }

  const handleEditFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setEditForm((prev) => ({ ...prev, [name]: value }))
  }

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingClient) {
      setError("No client selected for editing")
      return
    }

    try {
      // Validate required fields
      if (!editForm.name || !editForm.email) {
        throw new Error("Name and email are required fields")
      }

      const token = localStorage.getItem("token")
      if (!token) {
        throw new Error("Authentication token missing")
      }

      console.log("Sending update for client:", editingClient.id, "with data:", editForm)

      const response = await fetch(`http://localhost:8080/api/Manager/updateClient/${editingClient.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: editForm.name,
          email: editForm.email,
          phone: editForm.phone || "",
          company: editForm.company || "",
          status: editForm.status || "ACTIVE",
          address: editForm.address || null,
        }),
        credentials: "include",
      })

      const responseText = await response.text()

      // Handle 403 specifically
      if (response.status === 403) {
        throw new Error("You do not have permission to update this client")
      }

      if (!response.ok) {
        throw new Error(responseText || `Update failed with status ${response.status}`)
      }

      console.log("Update successful:", responseText)

      // Update local state
      setClients(clients.map((client) => (client.id === editingClient.id ? { ...client, ...editForm } : client)))
      setEditingClient(null)
      setError("")
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Update failed"
      console.error("Update error:", err)
      setError(errorMessage)

      // Redirect to login if unauthorized
      if (errorMessage.includes("permission") || errorMessage.includes("403")) {
        localStorage.removeItem("token")
        window.location.href = "/login"
      }
    }
  }

  const handleDelete = async (clientId: number) => {
    const isConfirmed = window.confirm("Are you sure you want to delete this client?")
    if (!isConfirmed) return

    try {
      const token = localStorage.getItem("token")
      if (!token) {
        throw new Error("Authentication token missing")
      }

      console.log("Deleting client:", clientId)

      const response = await fetch(`http://localhost:8080/api/Manager/deleteClient/${clientId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        credentials: "include",
      })

      const responseText = await response.text()

      // Handle 403 specifically
      if (response.status === 403) {
        throw new Error("You do not have permission to delete this client")
      }

      if (!response.ok) {
        throw new Error(responseText || `Delete failed with status ${response.status}`)
      }

      console.log("Delete successful:", responseText)

      // Update local state
      setClients(clients.filter((client) => client.id !== clientId))
      setError("")
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Delete failed"
      console.error("Delete error:", err)
      setError(errorMessage)

      // Redirect to login if unauthorized
      if (errorMessage.includes("permission") || errorMessage.includes("403")) {
        localStorage.removeItem("token")
        window.location.href = "/login"
      }
    }
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

  const isModalOpen = editingClient !== null

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50 to-indigo-100">
      <Navbar role="manager" />

      {/* Animated background elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-purple-300/20 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob"></div>
        <div className="absolute top-1/3 right-1/4 w-64 h-64 bg-indigo-300/20 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-2000"></div>
        <div className="absolute bottom-1/4 left-1/3 w-64 h-64 bg-violet-300/20 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-4000"></div>
      </div>

      {/* Main Content with Blur Effect */}
      <div className={`relative transition-all duration-500 ${isModalOpen ? "blur-sm scale-95" : ""}`}>
        {/* Hero Section */}
        <div className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-purple-600/10 to-indigo-600/10"></div>
          <div className="relative container mx-auto px-6 pt-12 pb-8">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-purple-800 via-indigo-700 to-blue-800 bg-clip-text text-transparent mb-4">
                  Team Client Portfolio
                </h1>
                <p className="text-lg text-slate-600 font-medium">Manage and track your team's client relationships</p>
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
              <div className="flex flex-grow items-center gap-4 flex-wrap w-full">
                {/* Global Search Bar */}
                <div className="flex-grow max-w-full md:max-w-md">
                  <GlobalSearchBar
                    onSearchChange={handleSearch}
                    searchPlaceholder="Search clients by name, email, company, or assigned to..."
                  />
                </div>

                {/* Spacer */}
                <div className="flex-grow hidden md:block"></div>

                {/* Status Filter and Client Count */}
                <div className="flex items-center gap-4 flex-wrap">
                  <div className="relative group">
                    <select
                      className="appearance-none bg-white/90 backdrop-blur-sm border border-slate-200 rounded-xl px-6 py-3 pr-12 font-medium text-slate-700 shadow-lg hover:shadow-xl transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent hover:border-purple-300"
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
                      className="absolute right-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400 pointer-events-none group-hover:text-purple-500 transition-colors duration-300 group-hover:scale-110"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                    <div className="absolute inset-0 rounded-xl border-2 border-purple-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
                  </div>

                  <div className="text-sm text-slate-600 bg-slate-100/80 px-4 py-2 rounded-lg font-medium p-3 bg-gradient-to-r from-slate-100 to-slate-200 rounded-xl text-slate-800 font-semibold text-center group-hover:from-purple-100 group-hover:to-indigo-100 group-hover:text-purple-800 transition-all duration-300 shadow-sm group-hover:shadow-md">
                    {finalFilteredClients.length} {finalFilteredClients.length === 1 ? "Client" : "Clients"}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Loading State */}
          {loading ? (
            <div className="text-center p-16 bg-white/60 backdrop-blur-sm rounded-3xl shadow-xl border border-white/20">
              <div className="relative inline-flex items-center justify-center w-16 h-16 mb-6">
                <div className="absolute inset-0 rounded-full border-4 border-purple-200 animate-pulse"></div>
                <div className="absolute inset-0 rounded-full border-t-4 border-purple-600 animate-spin"></div>
              </div>
              <h3 className="text-xl font-semibold text-slate-700 mb-2">Loading Team Clients</h3>
              <p className="text-slate-500">Please wait while we fetch your team's client data...</p>
            </div>
          ) : (
            <>
              {Array.isArray(finalFilteredClients) && finalFilteredClients.length > 0 ? (
                <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
                  {finalFilteredClients.map((client, index) => (
                    <div
                      key={client.id}
                      className="group bg-white/80 backdrop-blur-sm border border-white/20 rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-500 transform hover:scale-[1.02] p-6 relative overflow-hidden animate-in fade-in zoom-in"
                      style={{
                        animationDelay: `${index * 100}ms`,
                        animation: `slideInUp 0.6s ease-out ${index * 0.1}s both`,
                      }}
                    >
                      {/* Decorative gradient */}
                      <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-purple-500/10 to-indigo-500/10 rounded-full transform translate-x-16 -translate-y-16 group-hover:scale-150 transition-transform duration-700"></div>

                      <div className="relative z-10">
                        <div className="flex items-start justify-between mb-4">
                          <div>
                            <h2 className="text-xl font-bold text-slate-800 mb-1 group-hover:text-purple-700 transition-colors duration-300">
                              {client.name}
                            </h2>
                            <div className="flex items-center gap-2">
                              <span
                                className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(client.status)} shadow-sm group-hover:shadow-md transition-all duration-300 transform group-hover:scale-105`}
                              >
                                {client.status}
                              </span>
                            </div>
                          </div>
                          <div className="w-12 h-12 bg-gradient-to-br from-purple-100 to-indigo-100 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                            <svg
                              className="w-6 h-6 text-purple-600"
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
                        </div>

                        <div className="space-y-3">
                          <div className="flex items-center gap-3 p-3 bg-white/90 backdrop-blur-sm rounded-xl border border-slate-100 group-hover:bg-gradient-to-r group-hover:from-purple-50/50 group-hover:to-indigo-50/50 transition-all duration-300">
                            <svg
                              className="w-4 h-4 text-slate-500 flex-shrink-0 group-hover:text-purple-600 transition-colors duration-300"
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
                            <span className="text-sm text-slate-800 font-medium truncate group-hover:text-purple-800 transition-colors duration-300">
                              {client.email}
                            </span>
                          </div>

                          <div className="flex items-center gap-3 p-3 bg-white/90 backdrop-blur-sm rounded-xl border border-slate-100 group-hover:bg-gradient-to-r group-hover:from-purple-50/50 group-hover:to-indigo-50/50 transition-all duration-300">
                            <svg
                              className="w-4 h-4 text-slate-500 flex-shrink-0 group-hover:text-purple-600 transition-colors duration-300"
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
                            <span className="text-sm text-slate-800 font-medium group-hover:text-purple-800 transition-colors duration-300">
                              {client.phone}
                            </span>
                          </div>

                          <div className="flex items-center gap-3 p-3 bg-white/90 backdrop-blur-sm rounded-xl border border-slate-100 group-hover:bg-gradient-to-r group-hover:from-purple-50/50 group-hover:to-indigo-50/50 transition-all duration-300">
                            <svg
                              className="w-4 h-4 text-slate-500 flex-shrink-0 group-hover:text-purple-600 transition-colors duration-300"
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
                            <span className="text-sm text-slate-800 font-medium truncate group-hover:text-purple-800 transition-colors duration-300">
                              {client.company}
                            </span>
                          </div>

                          {client.address && (
                            <div className="flex items-center gap-3 p-3 bg-white/90 backdrop-blur-sm rounded-xl border border-slate-100 group-hover:bg-gradient-to-r group-hover:from-purple-50/50 group-hover:to-indigo-50/50 transition-all duration-300">
                              <svg
                                className="w-4 h-4 text-slate-500 flex-shrink-0 group-hover:text-purple-600 transition-colors duration-300"
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
                              <span className="text-sm text-slate-800 font-medium truncate group-hover:text-purple-800 transition-colors duration-300">
                                {client.address}
                              </span>
                            </div>
                          )}

                          {/* <div className="flex items-center gap-3 p-3 bg-gradient-to-r from-purple-50/90 to-indigo-50/90 backdrop-blur-sm rounded-xl border border-purple-100 group-hover:from-purple-100/90 group-hover:to-indigo-100/90 transition-all duration-300">
                            <svg
                              className="w-4 h-4 text-purple-600 flex-shrink-0 group-hover:scale-110 transition-transform duration-300"
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
                              <span className="text-sm text-slate-800 font-medium truncate group-hover:text-purple-800 transition-colors duration-300">
                                {client.assignedTo}
                                </span>
                          </div> */}

                          {client.createdAt && (
                            <div className="flex items-center gap-3 p-3 bg-white/90 backdrop-blur-sm rounded-xl border border-slate-100 group-hover:bg-gradient-to-r group-hover:from-purple-50/50 group-hover:to-indigo-50/50 transition-all duration-300">
                              <svg
                                className="w-4 h-4 text-slate-500 flex-shrink-0 group-hover:text-purple-600 transition-colors duration-300"
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
                              <span className="text-sm text-slate-800 font-medium group-hover:text-purple-800 transition-colors duration-300">
                                {new Date(client.createdAt).toLocaleDateString()}
                              </span>
                            </div>
                          )}

                          {/* Enhanced Action Buttons */}
                          <div className="flex gap-3 mt-6">
                            <button
                              onClick={() => handleEditClick(client)}
                              className="group relative overflow-hidden flex-1 bg-gradient-to-r from-purple-600 to-indigo-600 text-white py-3 px-4 rounded-xl hover:from-purple-700 hover:to-indigo-700 transition-all duration-300 shadow-xl hover:shadow-purple-500/50 transform hover:scale-105 font-semibold flex items-center justify-center gap-2"
                            >
                              <span className="relative z-10 flex items-center gap-2">
                                <svg
                                  className="w-4 h-4 group-hover:scale-110 transition-transform duration-300"
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                                  />
                                </svg>
                                Edit
                              </span>
                              <div className="absolute inset-0 bg-gradient-to-r from-purple-400 to-indigo-400 opacity-0 group-hover:opacity-30 transition-opacity duration-300"></div>
                            </button>
                            <button
                              onClick={() => handleDelete(client.id)}
                              className="group relative overflow-hidden flex-1 bg-gradient-to-r from-red-600 to-rose-600 text-white py-3 px-4 rounded-xl hover:from-red-700 hover:to-rose-700 transition-all duration-300 shadow-xl hover:shadow-red-500/50 transform hover:scale-105 font-semibold flex items-center justify-center gap-2"
                            >
                              <span className="relative z-10 flex items-center gap-2">
                                <svg
                                  className="w-4 h-4 group-hover:scale-110 transition-transform duration-300"
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                                  />
                                </svg>
                                Delete
                              </span>
                              <div className="absolute inset-0 bg-gradient-to-r from-red-400 to-rose-400 opacity-0 group-hover:opacity-30 transition-opacity duration-300"></div>
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center p-16 bg-white/60 backdrop-blur-sm rounded-3xl shadow-xl border border-white/20">
                  <div className="w-20 h-20 bg-gradient-to-br from-purple-200 to-indigo-300 rounded-2xl flex items-center justify-center mx-auto mb-6">
                    <svg className="w-10 h-10 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
                    {statusFilter || currentSearchTerm
                      ? `No clients matching your criteria found.`
                      : "No clients available in your team."}
                  </p>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Enhanced Edit Modal */}
      {editingClient && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm overflow-y-auto h-full w-full z-50 flex items-center justify-center p-4">
          <div className="relative w-full max-w-2xl bg-white/95 backdrop-blur-lg rounded-3xl shadow-2xl border border-white/30 animate-in fade-in zoom-in duration-300">
            <div className="flex items-center justify-between p-6 border-b border-slate-200">
              <h3 className="text-2xl font-bold bg-gradient-to-r from-purple-800 to-indigo-800 bg-clip-text text-transparent">
                Edit Client
              </h3>
              <button
                onClick={() => setEditingClient(null)}
                className="text-slate-400 hover:text-purple-600 transition-colors duration-300 p-2 hover:bg-slate-100 rounded-xl"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <form onSubmit={handleEditSubmit} className="p-6">
              <div className="space-y-6 max-h-[70vh] overflow-y-auto">
                {/* Name Field */}
                <div>
                  <label className="block text-sm font-semibold text-slate-800 mb-2">
                    Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={editForm.name}
                    onChange={handleEditFormChange}
                    className="w-full px-4 py-3 border border-slate-200 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white/90 backdrop-blur-sm transition-all duration-300 text-slate-800 placeholder-slate-400 hover:bg-gradient-to-r hover:from-purple-50/50 hover:to-indigo-50/50"
                    required
                  />
                </div>

                {/* Email Field */}
                <div>
                  <label className="block text-sm font-semibold text-slate-800 mb-2">
                    Email <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={editForm.email}
                    onChange={handleEditFormChange}
                    className="w-full px-4 py-3 border border-slate-200 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white/90 backdrop-blur-sm transition-all duration-300 text-slate-800 placeholder-slate-400 hover:bg-gradient-to-r hover:from-purple-50/50 hover:to-indigo-50/50"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  {/* Phone Field */}
                  <div>
                    <label className="block text-sm font-semibold text-slate-800 mb-2">Phone</label>
                    <input
                      type="text"
                      name="phone"
                      value={editForm.phone}
                      onChange={handleEditFormChange}
                      className="w-full px-4 py-3 border border-slate-200 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white/90 backdrop-blur-sm transition-all duration-300 text-slate-800 placeholder-slate-400 hover:bg-gradient-to-r hover:from-purple-50/50 hover:to-indigo-50/50"
                    />
                  </div>

                  {/* Company Field */}
                  <div>
                    <label className="block text-sm font-semibold text-slate-800 mb-2">Company</label>
                    <input
                      type="text"
                      name="company"
                      value={editForm.company}
                      onChange={handleEditFormChange}
                      className="w-full px-4 py-3 border border-slate-200 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white/90 backdrop-blur-sm transition-all duration-300 text-slate-800 placeholder-slate-400 hover:bg-gradient-to-r hover:from-purple-50/50 hover:to-indigo-50/50"
                    />
                  </div>
                </div>

                {/* Status Field */}
                <div className="relative group">
                  <label className="block text-sm font-semibold text-slate-800 mb-2">
                    Status <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="status"
                    value={editForm.status}
                    onChange={handleEditFormChange}
                    className="appearance-none w-full px-4 py-3 border border-slate-200 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white/90 backdrop-blur-sm transition-all duration-300 pr-12 text-slate-800 hover:bg-gradient-to-r hover:from-purple-50/50 hover:to-indigo-50/50"
                    required
                  >
                    <option value="ACTIVE">Active</option>
                    <option value="INACTIVE">Inactive</option>
                    <option value="ON_HOLD">On Hold</option>
                    <option value="CLOSED">Closed</option>
                  </select>
                  <svg
                    className="absolute right-4 top-[60%] transform -translate-y-1/2 w-5 h-5 text-slate-400 pointer-events-none group-hover:text-purple-500 transition-colors duration-300 group-hover:scale-110"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>

                {/* Address Field */}
                <div>
                  <label className="block text-sm font-semibold text-slate-800 mb-2">Address</label>
                  <input
                    type="text"
                    name="address"
                    value={editForm.address}
                    onChange={handleEditFormChange}
                    className="w-full px-4 py-3 border border-slate-200 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white/90 backdrop-blur-sm transition-all duration-300 text-slate-800 placeholder-slate-400 hover:bg-gradient-to-r hover:from-purple-50/50 hover:to-indigo-50/50"
                  />
                </div>
              </div>

              {/* Form Actions */}
              <div className="flex justify-end space-x-3 pt-6 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setEditingClient(null)}
                  className="group relative overflow-hidden bg-white/90 backdrop-blur-sm text-slate-700 px-6 py-3 rounded-xl hover:bg-gradient-to-r hover:from-purple-50 hover:to-indigo-50 hover:text-purple-700 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105 font-semibold border border-slate-200"
                >
                  <span className="relative z-10">Cancel</span>
                  <div className="absolute inset-0 bg-gradient-to-r from-purple-400 to-indigo-400 opacity-0 group-hover:opacity-20 transition-opacity duration-300"></div>
                </button>
                <button
                  type="submit"
                  className="group relative overflow-hidden bg-gradient-to-r from-purple-600 to-indigo-600 text-white px-6 py-3 rounded-xl hover:from-purple-700 hover:to-indigo-700 transition-all duration-300 shadow-xl hover:shadow-purple-500/50 transform hover:scale-105 font-semibold"
                >
                  <span className="relative z-10">Save Changes</span>
                  <div className="absolute inset-0 bg-gradient-to-r from-purple-400 to-indigo-400 opacity-0 group-hover:opacity-30 transition-opacity duration-300"></div>
                </button>
              </div>

              {/* Error Message */}
              {error && (
                <div className="mt-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">{error}</div>
              )}
            </form>
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
        
        @keyframes blob {
          0% {
            transform: translate(0px, 0px) scale(1);
          }
          33% {
            transform: translate(30px, -50px) scale(1.1);
          }
          66% {
            transform: translate(-20px, 20px) scale(0.9);
          }
          100% {
            transform: translate(0px, 0px) scale(1);
          }
        }
        
        .animate-blob {
          animation: blob 7s infinite;
        }
        
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        
        .animation-delay-4000 {
          animation-delay: 4s;
        }
      `}</style>
    </div>
  )
}
