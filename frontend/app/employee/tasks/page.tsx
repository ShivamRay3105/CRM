"use client"

import type React from "react"
import { useState, useEffect, useMemo } from "react"
import { useRouter } from "next/navigation"
// import Navbar from "../../../components/Navbar"
import Navbar from "@/app/components/Navbar"

interface User {
  id: number
  name: string
  email: string
  phoneNumber: string
  address: string
  username: string
  password: string
  position: string
  department: string
  roles: string[]
  manager: User | null
}

interface Lead {
  id: number
  name: string
  company?: string
}

interface Task {
  id: number
  title: string
  description: string
  status: "TODO" | "IN_PROGRESS" | "DONE"
  priority: "LOW" | "MEDIUM" | "HIGH" | "URGENT"
  dueDate: string
  createdAt: string
  updatedAt: string
  assignedTo: User
  assignedToId: number
  assignedBy: User
  assignedById: number
  lead: Lead | null
  company?: string
}

interface PaginatedResponse {
  content: Task[]
  totalPages: number
  totalElements: number
  number: number
}

export default function EmployeeTasks() {
  const router = useRouter()
  const [allTasks, setAllTasks] = useState<Task[]>([]) // Store all tasks for search
  const [personalTasks, setPersonalTasks] = useState<Task[]>([])
  const [assignedTasks, setAssignedTasks] = useState<Task[]>([])
  const [leads, setLeads] = useState<Lead[]>([])

  // Separate pagination for personal and assigned tasks
  const [personalTasksPage, setPersonalTasksPage] = useState(0)
  const [assignedTasksPage, setAssignedTasksPage] = useState(0)
  const [personalTasksTotalPages, setPersonalTasksTotalPages] = useState(1)
  const [assignedTasksTotalPages, setAssignedTasksTotalPages] = useState(1)

  // Search and filter states
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState("")

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [newTask, setNewTask] = useState({
    title: "",
    description: "",
    status: "TODO" as "TODO" | "IN_PROGRESS" | "DONE",
    priority: "LOW" as "LOW" | "MEDIUM" | "HIGH" | "URGENT",
    dueDate: "",
    leadId: "",
  })
  const [editingTask, setEditingTask] = useState<Task | null>(null)
  const [viewingTask, setViewingTask] = useState<Task | null>(null)
  const [currentUserId, setCurrentUserId] = useState<number | null>(null)
  const [showAddModal, setShowAddModal] = useState(false)

  const normalizeTask = (task: any): Task => ({
    ...task,
    assignedTo:
      typeof task.assignedTo === "object"
        ? task.assignedTo
        : {
            id: task.assignedToId,
            name: task.assignedTo || "Unknown",
            email: "",
            phoneNumber: "",
            address: "",
            username: "",
            password: "",
            position: "",
            department: "",
            roles: [],
            manager: null,
          },
    assignedBy:
      typeof task.assignedBy === "object"
        ? task.assignedBy
        : {
            id: task.assignedById,
            name: task.assignedBy || "Unknown",
            email: "",
            phoneNumber: "",
            address: "",
            username: "",
            password: "",
            position: "",
            department: "",
            roles: [],
            manager: null,
          },
    lead: task.leadId
      ? {
          id: task.leadId,
          name: task.leadExecutive || leads.find((l) => l.id === task.leadId)?.name || "Unknown",
          company: task.company,
        }
      : null,
    company: task.company || undefined,
  })

  const fetchCurrentUser = async () => {
    try {
      const response = await fetch("http://localhost:8080/api/users/me", {
        credentials: "include",
        headers: { "Content-Type": "application/json" },
      })
      if (!response.ok) throw new Error(`User fetch failed: ${response.status}`)
      const data = await response.json()
      setCurrentUserId(data.id || null)
    } catch (err) {
      setError(`Failed to fetch user: ${(err as Error).message}`)
      console.error("Fetch user error:", err)
    }
  }

  // Fetch all tasks without pagination for search functionality
  const fetchAllTasks = async () => {
    try {
      setLoading(true)
      let allTasksData: any[] = []
      let currentPage = 0
      let totalPages = 1

      // Keep fetching until we get all pages
      do {
        const response = await fetch(`http://localhost:8080/api/Tasks/myTasks?page=${currentPage}&size=50`, {
          credentials: "include",
          headers: { "Content-Type": "application/json" },
        })
        if (!response.ok) throw new Error(`Tasks fetch failed: ${response.status}`)

        const data: PaginatedResponse = await response.json()
        allTasksData = [...allTasksData, ...data.content]
        totalPages = data.totalPages
        currentPage++
      } while (currentPage < totalPages)

      // Map and process all tasks
      const mappedTasks = allTasksData.map((task) => normalizeTask(task))

      // Remove duplicates based on ID
      const uniqueTasks = mappedTasks.filter((task, index, self) => index === self.findIndex((t) => t.id === task.id))

      // Store all tasks for search functionality
      setAllTasks(uniqueTasks)

      console.log("Fetched all tasks successfully:", {
        total: uniqueTasks.length,
      })
    } catch (err) {
      setError(`Failed to load tasks: ${(err as Error).message}`)
      console.error("Fetch tasks error:", err)
    } finally {
      setLoading(false)
    }
  }

  const fetchLeads = async () => {
    try {
      const response = await fetch("http://localhost:8080/api/Leads/myLeads?page=0&size=100", {
        credentials: "include",
        headers: { "Content-Type": "application/json" },
      })
      if (!response.ok) throw new Error("Failed to fetch leads")
      const data = await response.json()
      setLeads(data.content || [])
    } catch (err) {
      console.error("Fetch leads error:", err)
    }
  }

  // Filter and search tasks using useMemo for performance
  const filteredTasks = useMemo(() => {
    let filtered = allTasks

    // Apply status filter
    if (statusFilter && statusFilter !== "") {
      filtered = filtered.filter((task) => task.status === statusFilter)
    }

    // Apply search filter
    if (searchQuery.trim() !== "") {
      const query = searchQuery.toLowerCase().trim()
      filtered = filtered.filter(
        (task) =>
          task.title.toLowerCase().includes(query) ||
          task.description.toLowerCase().includes(query) ||
          task.status.toLowerCase().includes(query) ||
          task.priority.toLowerCase().includes(query) ||
          (task.assignedTo.name && task.assignedTo.name.toLowerCase().includes(query)) ||
          (task.assignedBy.name && task.assignedBy.name.toLowerCase().includes(query)) ||
          (task.lead && task.lead.name.toLowerCase().includes(query)) ||
          (task.company && task.company.toLowerCase().includes(query)),
      )
    }

    return filtered
  }, [allTasks, statusFilter, searchQuery])

  // Separate filtered tasks based on assignment
  const filteredPersonalTasks = useMemo(() => {
    return filteredTasks.filter((task) => task.assignedToId === task.assignedById)
  }, [filteredTasks])

  const filteredAssignedTasks = useMemo(() => {
    return filteredTasks.filter((task) => task.assignedToId !== task.assignedById)
  }, [filteredTasks])

  // Paginate personal tasks
  const paginatedPersonalTasks = useMemo(() => {
    const startIndex = personalTasksPage * 10
    const endIndex = startIndex + 10
    return filteredPersonalTasks.slice(startIndex, endIndex)
  }, [filteredPersonalTasks, personalTasksPage])

  // Paginate assigned tasks
  const paginatedAssignedTasks = useMemo(() => {
    const startIndex = assignedTasksPage * 10
    const endIndex = startIndex + 10
    return filteredAssignedTasks.slice(startIndex, endIndex)
  }, [filteredAssignedTasks, assignedTasksPage])

  // Update tasks and pagination when filtered data changes
  useEffect(() => {
    setPersonalTasks(paginatedPersonalTasks)
    setAssignedTasks(paginatedAssignedTasks)

    // Calculate pagination
    setPersonalTasksTotalPages(Math.max(1, Math.ceil(filteredPersonalTasks.length / 10)))
    setAssignedTasksTotalPages(Math.max(1, Math.ceil(filteredAssignedTasks.length / 10)))
  }, [paginatedPersonalTasks, paginatedAssignedTasks, filteredPersonalTasks.length, filteredAssignedTasks.length])

  // Reset to first page when search or filter changes
  useEffect(() => {
    setPersonalTasksPage(0)
    setAssignedTasksPage(0)
  }, [searchQuery, statusFilter])

  // Initial load
  useEffect(() => {
    const initializeData = async () => {
      try {
        setLoading(true)
        setError("")
        await fetchCurrentUser()
        await fetchAllTasks()
        await fetchLeads()
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
    if (currentUserId && !searchQuery && !statusFilter && personalTasksPage === 0 && assignedTasksPage === 0) {
      // Only refetch if we're on first page and no filters applied
      fetchAllTasks()
    }
  }, [currentUserId])

  const handleCreateTask = async () => {
    if (!newTask.title.trim()) return setError("Title is required")
    if (!newTask.description.trim()) return setError("Description is required")
    if (!newTask.dueDate) return setError("Due date is required")
    try {
      const response = await fetch("http://localhost:8080/api/Tasks/addTask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          ...newTask,
          dueDate: newTask.dueDate ? `${newTask.dueDate}T00:00:00` : null,
          leadId: newTask.leadId ? Number(newTask.leadId) : null,
        }),
      })
      if (!response.ok) throw new Error(`Create task failed: ${response.status}`)
      await response.json()
      setNewTask({ title: "", description: "", status: "TODO", priority: "LOW", dueDate: "", leadId: "" })
      setShowAddModal(false)
      setError("")
      await fetchAllTasks()
    } catch (err) {
      setError(`Failed to create task: ${(err as Error).message}`)
    }
  }

  const handleUpdateTask = async () => {
    if (!editingTask) return
    try {
      const dueDateFormatted = editingTask.dueDate.includes("T")
        ? editingTask.dueDate
        : `${editingTask.dueDate.split("T")[0]}T00:00:00`
      const response = await fetch(`http://localhost:8080/api/Tasks/TaskUpdate/${editingTask.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          title: editingTask.title,
          description: editingTask.description,
          status: editingTask.status,
          priority: editingTask.priority,
          dueDate: dueDateFormatted,
          leadId: editingTask.lead ? Number(editingTask.lead.id) : null,
          assignedToId: editingTask.assignedToId,
          assignedById: editingTask.assignedById,
        }),
      })
      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(errorText || "Failed to update task")
      }
      setEditingTask(null)
      setError("")
      await fetchAllTasks()
    } catch (err) {
      setError(`Failed to update task: ${(err as Error).message}`)
      console.error("Update task error:", err)
    }
  }

  const handleDeleteTask = async (taskId: number) => {
    if (!confirm("Are you sure you want to delete this task?")) return

    try {
      const response = await fetch(`http://localhost:8080/api/Tasks/deleteTask/${taskId}`, {
        method: "DELETE",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
      })
      if (!response.ok) throw new Error(`Delete task failed: ${response.status}`)
      setError("")
      await fetchAllTasks()
    } catch (err) {
      setError(`Failed to delete task: ${(err as Error).message}`)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "TODO":
        return "bg-blue-100 text-blue-800 border border-blue-200"
      case "IN_PROGRESS":
        return "bg-amber-100 text-amber-800 border border-amber-200"
      case "DONE":
        return "bg-emerald-100 text-emerald-800 border border-emerald-200"
      default:
        return "bg-slate-100 text-slate-800 border border-slate-200"
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "LOW":
        return "bg-green-100 text-green-800 border border-green-200"
      case "MEDIUM":
        return "bg-yellow-100 text-yellow-800 border border-yellow-200"
      case "HIGH":
        return "bg-orange-100 text-orange-800 border border-orange-200"
      case "URGENT":
        return "bg-red-100 text-red-800 border border-red-200"
      default:
        return "bg-slate-100 text-slate-800 border border-slate-200"
    }
  }

  const renderPaginationNumbers = (currentPage: number, totalPages: number, setPage: (page: number) => void) => {
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

  const handleTaskRowClick = (task: Task, event: React.MouseEvent) => {
    // Prevent opening modal if clicking on action buttons
    if ((event.target as HTMLElement).closest("button")) {
      return
    }
    setViewingTask(task)
  }

  const isModalOpen = showAddModal || editingTask !== null || viewingTask !== null

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
            <h3 className="text-xl font-semibold text-slate-700 mb-2">Loading Task Data</h3>
            <p className="text-slate-500">Please wait while we fetch your tasks...</p>
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
          isModalOpen ? "blur-sm scale-95" : ""
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
                  Employee Tasks Dashboard
                </h1>
                <p className="text-lg text-slate-600 font-medium">Manage and track your tasks efficiently</p>
              </div>
              <div className="hidden md:block">
                <div className="w-24 h-24 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-xl">
                  <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
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
                      setPersonalTasksPage(0)
                      setAssignedTasksPage(0)
                    }}
                  >
                    <option value="">All Statuses</option>
                    <option value="TODO">To Do</option>
                    <option value="IN_PROGRESS">In Progress</option>
                    <option value="DONE">Done</option>
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
                  {filteredPersonalTasks.length + filteredAssignedTasks.length}{" "}
                  {filteredPersonalTasks.length + filteredAssignedTasks.length === 1 ? "Task" : "Tasks"}
                  {(searchQuery || statusFilter) && (
                    <span className="text-indigo-600 ml-1">(filtered from {allTasks.length} total)</span>
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
                    placeholder="Search tasks across all pages..."
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

                {/* Add Task Button */}
                <div className="flex items-center">
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
                      Add Task
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
                  Search results for "{searchQuery}" - Found {filteredTasks.length}{" "}
                  {filteredTasks.length === 1 ? "task" : "tasks"}
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

          {/* Assigned Tasks */}
          {assignedTasks.length > 0 && (
            <div className="mb-8 bg-white/80 backdrop-blur-sm border border-white/20 rounded-2xl shadow-xl overflow-hidden">
              <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-blue-600 p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                      />
                    </svg>
                    <h2 className="text-2xl font-bold text-white">Tasks Assigned by Manager</h2>
                  </div>
                  <div className="text-white/80 text-sm">
                    Page {assignedTasksPage + 1} of {assignedTasksTotalPages} • {paginatedAssignedTasks.length} of{" "}
                    {filteredAssignedTasks.length} tasks
                  </div>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-gradient-to-r from-slate-50 to-indigo-50 border-b border-slate-200">
                      <th className="px-6 py-4 text-left text-sm font-semibold text-slate-900 uppercase tracking-wider">
                        Title
                      </th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-slate-900 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-slate-900 uppercase tracking-wider">
                        Priority
                      </th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-slate-900 uppercase tracking-wider">
                        Lead
                      </th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-slate-900 uppercase tracking-wider">
                        Assigned By
                      </th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-slate-900 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {assignedTasks.map((task, index) => (
                      <tr
                        key={`assigned-task-${task.id}`}
                        onClick={(e) => handleTaskRowClick(task, e)}
                        className="group hover:bg-gradient-to-r hover:from-indigo-50/50 hover:to-purple-50/50 transition-all duration-500 transform hover:scale-[1.01] hover:shadow-lg cursor-pointer"
                        style={{
                          animation: `slideInUp 0.6s ease-out ${index * 0.1}s both`,
                        }}
                      >
                        <td className="px-6 py-4">
                          <div className="p-3 bg-gradient-to-r from-slate-100 to-slate-200 rounded-xl text-slate-800 font-semibold group-hover:from-indigo-100 group-hover:to-purple-100 group-hover:text-indigo-800 transition-all duration-300 shadow-sm group-hover:shadow-md">
                            {task.title}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span
                            className={`inline-flex items-center px-3 py-2 rounded-xl text-sm font-semibold shadow-sm group-hover:shadow-md transition-all duration-300 transform group-hover:scale-105 ${getStatusColor(task.status)}`}
                          >
                            {task.status.replace("_", " ")}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span
                            className={`inline-flex items-center px-3 py-2 rounded-xl text-sm font-semibold shadow-sm group-hover:shadow-md transition-all duration-300 transform group-hover:scale-105 ${getPriorityColor(task.priority)}`}
                          >
                            {task.priority}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          {task.lead ? (
                            <div className="p-3 bg-gradient-to-r from-slate-100 to-slate-200 rounded-xl text-slate-800 font-semibold text-center group-hover:from-indigo-100 group-hover:to-purple-100 group-hover:text-indigo-800 transition-all duration-300 shadow-sm group-hover:shadow-md">
                              {task.lead.name} (ID: {task.lead.id})
                            </div>
                          ) : (
                            <div className="text-sm text-slate-500 italic p-3 bg-gradient-to-r from-slate-100 to-slate-200 rounded-xl text-slate-800 font-semibold text-center group-hover:from-indigo-100 group-hover:to-purple-100 group-hover:text-indigo-800 transition-all duration-300 shadow-sm group-hover:shadow-md">
                              No lead
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <div className="p-3 bg-gradient-to-r from-slate-100 to-slate-200 rounded-xl text-slate-800 font-semibold text-center group-hover:from-indigo-100 group-hover:to-purple-100 group-hover:text-indigo-800 transition-all duration-300 shadow-sm group-hover:shadow-md">
                            {task.assignedBy.name || "Unknown"}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                handleDeleteTask(task.id)
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

              {/* Assigned Tasks Pagination */}
              {assignedTasksTotalPages > 1 && (
                <div className="px-6 py-4 bg-white/90 backdrop-blur-sm border-t border-slate-100 flex justify-center items-center rounded-b-2xl">
                  <button
                    onClick={() => setAssignedTasksPage((prev) => Math.max(0, prev - 1))}
                    disabled={assignedTasksPage === 0}
                    className="group relative overflow-hidden bg-white/90 backdrop-blur-sm text-slate-700 px-4 py-2 rounded-xl hover:from-indigo-50 hover:to-purple-50 hover:text-indigo-700 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105 font-semibold border border-slate-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-none"
                  >
                    <span className="relative z-10">Previous</span>
                    <div className="absolute inset-0 bg-gradient-to-r from-indigo-400 to-purple-400 opacity-0 group-hover:opacity-20 transition-opacity duration-300"></div>
                  </button>
                  <div className="flex mx-2">
                    {renderPaginationNumbers(assignedTasksPage, assignedTasksTotalPages, setAssignedTasksPage)}
                  </div>
                  <button
                    onClick={() => setAssignedTasksPage((prev) => Math.min(assignedTasksTotalPages - 1, prev + 1))}
                    disabled={assignedTasksPage === assignedTasksTotalPages - 1}
                    className="group relative overflow-hidden bg-white/90 backdrop-blur-sm text-slate-700 px-4 py-2 rounded-xl hover:from-indigo-50 hover:to-purple-50 hover:text-indigo-700 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105 font-semibold border border-slate-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-none"
                  >
                    <span className="relative z-10">Next</span>
                    <div className="absolute inset-0 bg-gradient-to-r from-indigo-400 to-purple-400 opacity-0 group-hover:opacity-20 transition-opacity duration-300"></div>
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Personal Tasks */}
          <div className="bg-white/80 backdrop-blur-sm border border-white/20 rounded-2xl shadow-xl overflow-hidden">
            <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-blue-600 p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                    />
                  </svg>
                  <h2 className="text-2xl font-bold text-white">Your Personal Tasks</h2>
                </div>
                <div className="text-white/80 text-sm">
                  Page {personalTasksPage + 1} of {personalTasksTotalPages} • {paginatedPersonalTasks.length} of{" "}
                  {filteredPersonalTasks.length} tasks
                </div>
              </div>
            </div>

            {personalTasks.length === 0 ? (
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
                    d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                  />
                </svg>
                <h3 className="mt-2 text-xl font-semibold text-slate-700">
                  {searchQuery ? `No tasks found matching "${searchQuery}"` : "No personal tasks yet"}
                </h3>
                <p className="mt-1 text-slate-500">
                  {searchQuery ? "Try adjusting your search terms." : "Get started by creating a new task."}
                </p>
                {!searchQuery && (
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
                        Add Task
                      </span>
                      <div className="absolute inset-0 bg-gradient-to-r from-indigo-400 to-purple-400 opacity-0 group-hover:opacity-30 transition-opacity duration-300"></div>
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-gradient-to-r from-slate-50 to-indigo-50 border-b border-slate-200">
                        <th className="px-6 py-4 text-left text-sm font-semibold text-slate-900 uppercase tracking-wider">
                          Title
                        </th>
                        <th className="px-6 py-4 text-left text-sm font-semibold text-slate-900 uppercase tracking-wider">
                          Status
                        </th>
                        <th className="px-6 py-4 text-left text-sm font-semibold text-slate-900 uppercase tracking-wider">
                          Priority
                        </th>
                        <th className="px-6 py-4 text-left text-sm font-semibold text-slate-900 uppercase tracking-wider">
                          Lead
                        </th>
                        <th className="px-6 py-4 text-left text-sm font-semibold text-slate-900 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {personalTasks.map((task, index) => (
                        <tr
                          key={`personal-task-${task.id}`}
                          onClick={(e) => handleTaskRowClick(task, e)}
                          className="group hover:bg-gradient-to-r hover:from-indigo-50/50 hover:to-purple-50/50 transition-all duration-500 transform hover:scale-[1.01] hover:shadow-lg cursor-pointer"
                          style={{
                            animation: `slideInUp 0.6s ease-out ${index * 0.1}s both`,
                          }}
                        >
                          <td className="px-6 py-4">
                            <div className="p-3 bg-gradient-to-r from-slate-100 to-slate-200 rounded-xl text-slate-800 font-semibold group-hover:from-indigo-100 group-hover:to-purple-100 group-hover:text-indigo-800 transition-all duration-300 shadow-sm group-hover:shadow-md">
                              {task.title}
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <span
                              className={`inline-flex items-center px-3 py-2 rounded-xl text-sm font-semibold shadow-sm group-hover:shadow-md transition-all duration-300 transform group-hover:scale-105 ${getStatusColor(task.status)}`}
                            >
                              {task.status.replace("_", " ")}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <span
                              className={`inline-flex items-center px-3 py-2 rounded-xl text-sm font-semibold shadow-sm group-hover:shadow-md transition-all duration-300 transform group-hover:scale-105 ${getPriorityColor(task.priority)}`}
                            >
                              {task.priority}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            {task.lead ? (
                              <div className="p-3 bg-gradient-to-r from-slate-100 to-slate-200 rounded-xl text-slate-800 font-semibold text-center group-hover:from-indigo-100 group-hover:to-purple-100 group-hover:text-indigo-800 transition-all duration-300 shadow-sm group-hover:shadow-md">
                                {task.lead.name} (ID: {task.lead.id})
                              </div>
                            ) : (
                              <div className="text-sm text-slate-500 italic p-3 bg-gradient-to-r from-slate-100 to-slate-200 rounded-xl text-slate-800 font-semibold text-center group-hover:from-indigo-100 group-hover:to-purple-100 group-hover:text-indigo-800 transition-all duration-300 shadow-sm group-hover:shadow-md">
                                No lead
                              </div>
                            )}
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation()
                                  setEditingTask(task)
                                }}
                                className="group relative overflow-hidden bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-4 py-2 rounded-xl hover:from-indigo-700 hover:to-purple-700 transition-all duration-300 transform hover:scale-105 shadow-sm hover:shadow-md font-semibold"
                              >
                                <span className="relative z-10">Edit</span>
                                <div className="absolute inset-0 bg-gradient-to-r from-indigo-400 to-purple-400 opacity-0 group-hover:opacity-30 transition-opacity duration-300"></div>
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation()
                                  handleDeleteTask(task.id)
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

                {/* Personal Tasks Pagination */}
                {personalTasksTotalPages > 1 && (
                  <div className="px-6 py-4 bg-white/90 backdrop-blur-sm border-t border-slate-100 flex justify-center items-center rounded-b-2xl">
                    <button
                      onClick={() => setPersonalTasksPage((prev) => Math.max(0, prev - 1))}
                      disabled={personalTasksPage === 0}
                      className="group relative overflow-hidden bg-white/90 backdrop-blur-sm text-slate-700 px-4 py-2 rounded-xl hover:from-indigo-50 hover:to-purple-50 hover:text-indigo-700 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105 font-semibold border border-slate-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-none"
                    >
                      <span className="relative z-10">Previous</span>
                      <div className="absolute inset-0 bg-gradient-to-r from-indigo-400 to-purple-400 opacity-0 group-hover:opacity-20 transition-opacity duration-300"></div>
                    </button>
                    <div className="flex mx-2">
                      {renderPaginationNumbers(personalTasksPage, personalTasksTotalPages, setPersonalTasksPage)}
                    </div>
                    <button
                      onClick={() => setPersonalTasksPage((prev) => Math.min(personalTasksTotalPages - 1, prev + 1))}
                      disabled={personalTasksPage === personalTasksTotalPages - 1}
                      className="group relative overflow-hidden bg-white/90 backdrop-blur-sm text-slate-700 px-4 py-2 rounded-xl hover:from-indigo-50 hover:to-purple-50 hover:text-indigo-700 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105 font-semibold border border-slate-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-none"
                    >
                      <span className="relative z-10">Next</span>
                      <div className="absolute inset-0 bg-gradient-to-r from-indigo-400 to-purple-400 opacity-0 group-hover:opacity-20 transition-opacity duration-300"></div>
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* Task Detail Modal */}
      {viewingTask && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div
            className="bg-white/95 backdrop-blur-sm rounded-3xl p-6 shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto transform transition-all duration-300 scale-95 animate-slideInUp border border-white/20"
            style={{ animationFillMode: "forwards" }}
          >
            <h2 className="text-2xl font-bold bg-gradient-to-r from-indigo-700 via-purple-700 to-blue-700 bg-clip-text text-transparent mb-4 text-center">
              Task Details: {viewingTask.title}
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div className="bg-gradient-to-r from-slate-50 to-indigo-50 p-3 rounded-xl border border-slate-200">
                <p className="text-sm font-medium text-slate-700 mb-1">ID:</p>
                <p className="text-slate-900 font-semibold">{viewingTask.id}</p>
              </div>
              <div className="bg-gradient-to-r from-slate-50 to-indigo-50 p-3 rounded-xl border border-slate-200">
                <p className="text-sm font-medium text-slate-700 mb-1">Title:</p>
                <p className="text-slate-900 font-semibold">{viewingTask.title}</p>
              </div>
              <div className="col-span-1 md:col-span-2 bg-gradient-to-r from-slate-50 to-indigo-50 p-3 rounded-xl border border-slate-200">
                <p className="text-sm font-medium text-slate-700 mb-2">Description:</p>
                <p className="text-slate-900 font-semibold bg-white/80 p-3 rounded-lg border border-slate-200 backdrop-blur-sm text-sm">
                  {viewingTask.description}
                </p>
              </div>
              <div className="bg-gradient-to-r from-slate-50 to-indigo-50 p-3 rounded-xl border border-slate-200">
                <p className="text-sm font-medium text-slate-700 mb-2">Status:</p>
                <span
                  className={`inline-flex items-center px-3 py-2 rounded-xl text-sm font-semibold ${getStatusColor(viewingTask.status)}`}
                >
                  {viewingTask.status.replace("_", " ")}
                </span>
              </div>
              <div className="bg-gradient-to-r from-slate-50 to-indigo-50 p-3 rounded-xl border border-slate-200">
                <p className="text-sm font-medium text-slate-700 mb-2">Priority:</p>
                <span
                  className={`inline-flex items-center px-3 py-2 rounded-xl text-sm font-semibold ${getPriorityColor(viewingTask.priority)}`}
                >
                  {viewingTask.priority}
                </span>
              </div>
              <div className="bg-gradient-to-r from-slate-50 to-indigo-50 p-3 rounded-xl border border-slate-200">
                <p className="text-sm font-medium text-slate-700 mb-1">Due Date:</p>
                <p className="text-slate-900 font-semibold text-sm">
                  {new Date(viewingTask.dueDate.split("T")[0]).toLocaleDateString()}
                </p>
              </div>
              <div className="bg-gradient-to-r from-slate-50 to-indigo-50 p-3 rounded-xl border border-slate-200">
                <p className="text-sm font-medium text-slate-700 mb-1">Created At:</p>
                <p className="text-slate-900 font-semibold text-sm">
                  {new Date(viewingTask.createdAt).toLocaleString()}
                </p>
              </div>
              <div className="bg-gradient-to-r from-slate-50 to-indigo-50 p-3 rounded-xl border border-slate-200">
                <p className="text-sm font-medium text-slate-700 mb-1">Assigned To:</p>
                <p className="text-slate-900 font-semibold">{viewingTask.assignedTo.name}</p>
              </div>
              <div className="bg-gradient-to-r from-slate-50 to-indigo-50 p-3 rounded-xl border border-slate-200">
                <p className="text-sm font-medium text-slate-700 mb-1">Assigned By:</p>
                <p className="text-slate-900 font-semibold">{viewingTask.assignedBy.name}</p>
              </div>
              {viewingTask.lead && (
                <div className="col-span-1 md:col-span-2 bg-gradient-to-r from-slate-50 to-indigo-50 p-3 rounded-xl border border-slate-200">
                  <p className="text-sm font-medium text-slate-700 mb-2">Associated Lead:</p>
                  <p className="text-slate-900 font-semibold bg-white/80 p-3 rounded-lg border border-slate-200 backdrop-blur-sm text-sm">
                    {viewingTask.lead.name} (ID: {viewingTask.lead.id})
                    {viewingTask.lead.company && ` - ${viewingTask.lead.company}`}
                  </p>
                </div>
              )}
            </div>

            <div className="flex justify-between items-center">
              {/* Only show edit button for personal tasks */}
              {viewingTask.assignedToId === viewingTask.assignedById && (
                <button
                  onClick={() => {
                    setEditingTask(viewingTask)
                    setViewingTask(null)
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
                    Edit Task
                  </span>
                </button>
              )}

              <button
                onClick={() => {
                  setViewingTask(null)
                }}
                className="group relative overflow-hidden bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-4 py-2 rounded-xl hover:from-indigo-700 hover:to-purple-700 transition-all duration-300 shadow-xl hover:shadow-indigo-500/50 transform hover:scale-105 font-semibold ml-auto"
              >
                <span className="relative z-10">Close</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Task Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div
            className="bg-white/95 backdrop-blur-sm rounded-3xl p-8 shadow-2xl w-full max-w-md transform transition-all duration-300 scale-95 animate-slideInUp border border-white/20"
            style={{ animationFillMode: "forwards" }}
          >
            <h2 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-indigo-700 via-purple-700 to-blue-700 bg-clip-text text-transparent mb-6 text-center">
              Add New Task
            </h2>
            {error && (
              <p className="text-red-600 text-sm mb-4 text-center bg-red-50 p-3 rounded-lg border border-red-200">
                {error}
              </p>
            )}
            <div className="space-y-4">
              <div>
                <label htmlFor="title" className="block text-sm font-medium text-gray-900 mb-1">
                  Title
                </label>
                <input
                  type="text"
                  id="title"
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-gray-900 transition-all duration-300 shadow-sm bg-white/80 backdrop-blur-sm"
                  value={newTask.title}
                  onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                  placeholder="Task Title"
                />
              </div>
              <div>
                <label htmlFor="description" className="block text-sm font-medium text-gray-900 mb-1">
                  Description
                </label>
                <textarea
                  id="description"
                  rows={4}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-gray-900 transition-all duration-300 shadow-sm bg-white/80 backdrop-blur-sm resize-y"
                  value={newTask.description}
                  onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
                  placeholder="Task Description"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="relative group">
                  <label htmlFor="status" className="block text-sm font-medium text-gray-900 mb-1">
                    Status
                  </label>
                  <select
                    id="status"
                    className="appearance-none w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-gray-900 transition-all duration-300 shadow-sm bg-white/80 backdrop-blur-sm pr-12"
                    value={newTask.status}
                    onChange={(e) =>
                      setNewTask({ ...newTask, status: e.target.value as "TODO" | "IN_PROGRESS" | "DONE" })
                    }
                  >
                    <option value="TODO">To Do</option>
                    <option value="IN_PROGRESS">In Progress</option>
                    <option value="DONE">Done</option>
                  </select>
                  <svg
                    className="absolute right-4 top-[60%] transform -translate-y-1/2 w-5 h-5 text-slate-400 pointer-events-none group-hover:text-indigo-500 transition-colors duration-300 group-hover:scale-110"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
                <div className="relative group">
                  <label htmlFor="priority" className="block text-sm font-medium text-gray-900 mb-1">
                    Priority
                  </label>
                  <select
                    id="priority"
                    className="appearance-none w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-gray-900 transition-all duration-300 shadow-sm bg-white/80 backdrop-blur-sm pr-12"
                    value={newTask.priority}
                    onChange={(e) =>
                      setNewTask({ ...newTask, priority: e.target.value as "LOW" | "MEDIUM" | "HIGH" | "URGENT" })
                    }
                  >
                    <option value="LOW">Low</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HIGH">High</option>
                    <option value="URGENT">Urgent</option>
                  </select>
                  <svg
                    className="absolute right-4 top-[60%] transform -translate-y-1/2 w-5 h-5 text-slate-400 pointer-events-none group-hover:text-indigo-500 transition-colors duration-300 group-hover:scale-110"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>
              <div>
                <label htmlFor="dueDate" className="block text-sm font-medium text-gray-900 mb-1">
                  Due Date
                </label>
                <input
                  type="date"
                  id="dueDate"
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-gray-900 transition-all duration-300 shadow-sm bg-white/80 backdrop-blur-sm"
                  value={newTask.dueDate}
                  onChange={(e) => setNewTask({ ...newTask, dueDate: e.target.value })}
                />
              </div>
              <div className="relative group">
                <label htmlFor="leadId" className="block text-sm font-medium text-gray-900 mb-1">
                  Associated Lead (Optional)
                </label>
                <select
                  id="leadId"
                  className="appearance-none w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-gray-900 transition-all duration-300 shadow-sm bg-white/80 backdrop-blur-sm pr-12"
                  value={newTask.leadId}
                  onChange={(e) => setNewTask({ ...newTask, leadId: e.target.value })}
                >
                  <option value="">No Lead</option>
                  {leads.map((lead) => (
                    <option key={lead.id} value={lead.id}>
                      {lead.name} (ID: {lead.id})
                    </option>
                  ))}
                </select>
                <svg
                  className="absolute right-4 top-[60%] transform -translate-y-1/2 w-5 h-5 text-slate-400 pointer-events-none group-hover:text-indigo-500 transition-colors duration-300 group-hover:scale-110"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
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
                onClick={handleCreateTask}
                className="group relative overflow-hidden bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-6 py-3 rounded-xl hover:from-indigo-700 hover:to-purple-700 transition-all duration-300 shadow-xl hover:shadow-indigo-500/50 transform hover:scale-105 font-semibold"
              >
                <span className="relative z-10">Add Task</span>
                <div className="absolute inset-0 bg-gradient-to-r from-indigo-400 to-purple-400 opacity-0 group-hover:opacity-30 transition-opacity duration-300"></div>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Task Modal */}
      {editingTask && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div
            className="bg-white/95 backdrop-blur-sm rounded-3xl p-8 shadow-2xl w-full max-w-md transform transition-all duration-300 scale-95 animate-slideInUp border border-white/20"
            style={{ animationFillMode: "forwards" }}
          >
            <h2 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-indigo-700 via-purple-700 to-blue-700 bg-clip-text text-transparent mb-6 text-center">
              Edit Task
            </h2>
            {error && (
              <p className="text-red-600 text-sm mb-4 text-center bg-red-50 p-3 rounded-lg border border-red-200">
                {error}
              </p>
            )}
            <div className="space-y-4">
              <div>
                <label htmlFor="edit-title" className="block text-sm font-medium text-gray-900 mb-1">
                  Title
                </label>
                <input
                  type="text"
                  id="edit-title"
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-gray-900 transition-all duration-300 shadow-sm bg-white/80 backdrop-blur-sm"
                  value={editingTask.title}
                  onChange={(e) => setEditingTask({ ...editingTask, title: e.target.value })}
                  placeholder="Task Title"
                />
              </div>
              <div>
                <label htmlFor="edit-description" className="block text-sm font-medium text-gray-900 mb-1">
                  Description
                </label>
                <textarea
                  id="edit-description"
                  rows={4}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-gray-900 transition-all duration-300 shadow-sm bg-white/80 backdrop-blur-sm resize-y"
                  value={editingTask.description}
                  onChange={(e) => setEditingTask({ ...editingTask, description: e.target.value })}
                  placeholder="Task Description"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="relative group">
                  <label htmlFor="edit-status" className="block text-sm font-medium text-gray-900 mb-1">
                    Status
                  </label>
                  <select
                    id="edit-status"
                    className="appearance-none w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-gray-900 transition-all duration-300 shadow-sm bg-white/80 backdrop-blur-sm pr-12"
                    value={editingTask.status}
                    onChange={(e) =>
                      setEditingTask({ ...editingTask, status: e.target.value as "TODO" | "IN_PROGRESS" | "DONE" })
                    }
                  >
                    <option value="TODO">To Do</option>
                    <option value="IN_PROGRESS">In Progress</option>
                    <option value="DONE">Done</option>
                  </select>
                  <svg
                    className="absolute right-4 top-[60%] transform -translate-y-1/2 w-5 h-5 text-slate-400 pointer-events-none group-hover:text-indigo-500 transition-colors duration-300 group-hover:scale-110"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
                <div className="relative group">
                  <label htmlFor="edit-priority" className="block text-sm font-medium text-gray-900 mb-1">
                    Priority
                  </label>
                  <select
                    id="edit-priority"
                    className="appearance-none w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-gray-900 transition-all duration-300 shadow-sm bg-white/80 backdrop-blur-sm pr-12"
                    value={editingTask.priority}
                    onChange={(e) =>
                      setEditingTask({
                        ...editingTask,
                        priority: e.target.value as "LOW" | "MEDIUM" | "HIGH" | "URGENT",
                      })
                    }
                  >
                    <option value="LOW">Low</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HIGH">High</option>
                    <option value="URGENT">Urgent</option>
                  </select>
                  <svg
                    className="absolute right-4 top-[60%] transform -translate-y-1/2 w-5 h-5 text-slate-400 pointer-events-none group-hover:text-indigo-500 transition-colors duration-300 group-hover:scale-110"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>
              <div>
                <label htmlFor="edit-dueDate" className="block text-sm font-medium text-gray-900 mb-1">
                  Due Date
                </label>
                <input
                  type="date"
                  id="edit-dueDate"
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-gray-900 transition-all duration-300 shadow-sm bg-white/80 backdrop-blur-sm"
                  value={editingTask.dueDate.split("T")[0]}
                  onChange={(e) => setEditingTask({ ...editingTask, dueDate: `${e.target.value}T00:00:00` })}
                />
              </div>
              <div className="relative group">
                <label htmlFor="edit-leadId" className="block text-sm font-medium text-gray-900 mb-1">
                  Associated Lead (Optional)
                </label>
                <select
                  id="edit-leadId"
                  className="appearance-none w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-gray-900 transition-all duration-300 shadow-sm bg-white/80 backdrop-blur-sm pr-12"
                  value={editingTask.lead?.id || ""}
                  onChange={(e) =>
                    setEditingTask({
                      ...editingTask,
                      lead: e.target.value
                        ? {
                            id: Number(e.target.value),
                            name: leads.find((l) => l.id === Number(e.target.value))?.name || "Unknown",
                            company: leads.find((l) => l.id === Number(e.target.value))?.company,
                          }
                        : null,
                    })
                  }
                >
                  <option value="">No Lead</option>
                  {leads.map((lead) => (
                    <option key={lead.id} value={lead.id}>
                      {lead.name} (ID: {lead.id})
                    </option>
                  ))}
                </select>
                <svg
                  className="absolute right-4 top-[60%] transform -translate-y-1/2 w-5 h-5 text-slate-400 pointer-events-none group-hover:text-indigo-500 transition-colors duration-300 group-hover:scale-110"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>
            <div className="flex justify-end space-x-4 mt-8">
              <button
                onClick={() => {
                  setEditingTask(null)
                  setError("")
                }}
                className="group relative overflow-hidden bg-white/90 backdrop-blur-sm text-gray-800 px-6 py-3 rounded-xl hover:bg-gray-50 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105 font-semibold border border-gray-300"
              >
                <span className="relative z-10">Cancel</span>
              </button>
              <button
                onClick={handleUpdateTask}
                className="group relative overflow-hidden bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-6 py-3 rounded-xl hover:from-indigo-700 hover:to-purple-700 transition-all duration-300 shadow-xl hover:shadow-indigo-500/50 transform hover:scale-105 font-semibold"
              >
                <span className="relative z-10">Save Changes</span>
                <div className="absolute inset-0 bg-gradient-to-r from-indigo-400 to-purple-400 opacity-0 group-hover:opacity-30 transition-opacity duration-300"></div>
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
