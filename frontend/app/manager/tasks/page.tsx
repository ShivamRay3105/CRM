"use client"

import type React from "react"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import Navbar from "../../components/Navbar"

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

interface Employee {
  id: number
  name: string
  username: string
}

export default function ManagerTasks() {
  const router = useRouter()
  // States to hold ALL tasks fetched from the backend for global searching
  const [allRawPersonalTasks, setAllRawPersonalTasks] = useState<Task[]>([])
  const [allRawAssignedTasks, setAllRawAssignedTasks] = useState<Task[]>([])
  const [allRawEmployeeTasks, setAllRawEmployeeTasks] = useState<Task[]>([])

  // States to hold the CURRENTLY DISPLAYED (filtered and paginated) tasks
  const [personalTasks, setPersonalTasks] = useState<Task[]>([])
  const [assignedTasks, setAssignedTasks] = useState<Task[]>([])
  const [employeeTasks, setEmployeeTasks] = useState<Task[]>([])

  const [leads, setLeads] = useState<Lead[]>([])
  const [employees, setEmployees] = useState<Employee[]>([])
  const [personalTasksPage, setPersonalTasksPage] = useState(0)
  const [employeeTasksPage, setEmployeeTasksPage] = useState(0)
  const [personalTasksTotalPages, setPersonalTasksTotalPages] = useState(1)
  const [employeeTasksTotalPages, setEmployeeTasksTotalPages] = useState(1)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [newTask, setNewTask] = useState({
    title: "",
    description: "",
    status: "TODO" as "TODO" | "IN_PROGRESS" | "DONE",
    priority: "LOW" as "LOW" | "MEDIUM" | "HIGH" | "URGENT",
    dueDate: "",
    leadId: "",
    taskType: "personal" as "personal" | "employee",
    assignedToId: "",
  })
  const [editingTask, setEditingTask] = useState<Task | null>(null)
  const [viewingTask, setViewingTask] = useState<Task | null>(null)
  const [currentUserId, setCurrentUserId] = useState<number | null>(null)
  const [showAddModal, setShowAddModal] = useState(false)

  // Single search term for all tasks
  const [searchQuery, setSearchQuery] = useState("")
  const [priorityFilter, setPriorityFilter] = useState("") // Global priority filter

  // Memoized normalizeTask function for stable reference
  const normalizeTask = useCallback((task: any, currentLeads: Lead[]): Task => ({
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
          name: currentLeads.find((l) => l.id === task.leadId)?.name || task.leadExecutive || "Unknown",
          company: task.company,
        }
      : null,
    company: task.company || undefined,
  }), []); // Empty dependency array for normalizeTask is correct as it uses currentLeads arg

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

  const fetchCurrentUser = async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/users/me`, {
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

  // Function to fetch ALL personal and assigned tasks
  const fetchAllTasks = useCallback(async (currentLeads: Lead[]) => {
    setLoading(true)
    try {
      // Fetch all personal and assigned tasks
      const personalResponse = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/Tasks/myTasks?page=0&size=9999`, {
        credentials: "include",
        headers: { "Content-Type": "application/json" },
      })
      if (!personalResponse.ok) throw new Error(`Personal tasks fetch failed: ${personalResponse.status}`)
      const personalData: PaginatedResponse = await personalResponse.json()
      const normalizedPersonalTasks = personalData.content.map((task) => normalizeTask(task, currentLeads))
      setAllRawPersonalTasks(normalizedPersonalTasks.filter((task) => task.assignedToId === task.assignedById))
      setAllRawAssignedTasks(normalizedPersonalTasks.filter((task) => task.assignedToId !== task.assignedById))

      // Fetch all employee tasks
      const employeeResponse = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/Manager/allTasksOfEmployees?page=0&size=9999`, {
        credentials: "include",
        headers: { "Content-Type": "application/json" },
      })
      if (!employeeResponse.ok) throw new Error(`Employee tasks fetch failed: ${employeeResponse.status}`)
      const employeeData: PaginatedResponse = await employeeResponse.json()
      const normalizedEmployeeTasks = employeeData.content.map((task) => normalizeTask(task, currentLeads))
      setAllRawEmployeeTasks(normalizedEmployeeTasks)

    } catch (err) {
      setError(`Failed to load all tasks: ${(err as Error).message}`)
      console.error("Fetch all tasks error:", err)
    } finally {
      setLoading(false)
    }
  }, [normalizeTask]);

  const fetchLeads = async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/Manager/allLeadsOfEmployees?page=0&size=100`, {
        credentials: "include",
        headers: { "Content-Type": "application/json" },
      })
      if (!response.ok) throw new Error("Failed to fetch leads")
      const data = await response.json()
      setLeads(data.content || [])
      return data.content || []; // Return leads to be used immediately
    } catch (err) {
      console.error("Fetch leads error:", err)
      return [];
    }
  }

  const fetchEmployees = async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/Manager/employees`, {
        credentials: "include",
        headers: { "Content-Type": "application/json" },
      })
      if (!response.ok) throw new Error("Failed to fetch employees")
      const data = await response.json()
      setEmployees(data || [])
    } catch (err) {
      console.error("Fetch employees error:", err)
    }
  }

  // Initial data fetch effect
  useEffect(() => {
    const token = localStorage.getItem("token")
    if (!token) {
      router.push("/login")
      return
    }

    const initData = async () => {
      await fetchCurrentUser()
      const fetchedLeads = await fetchLeads() // Fetch leads first
      await fetchAllTasks(fetchedLeads) // Then fetch all tasks, passing leads
      await fetchEmployees()
    }

    initData()
  }, [router, fetchAllTasks]); // fetchAllTasks is a useCallback, so its reference is stable

  // Effect to filter and paginate tasks based on search, filter, and page changes
  useEffect(() => {
    const lowerCaseSearchTerm = searchQuery.toLowerCase();

    // Filter personal and assigned tasks
    let currentPersonalTasks = [...allRawPersonalTasks];
    let currentAssignedTasks = [...allRawAssignedTasks];

    if (priorityFilter) {
      currentPersonalTasks = currentPersonalTasks.filter((task) => task.priority === priorityFilter);
      currentAssignedTasks = currentAssignedTasks.filter((task) => task.priority === priorityFilter);
    }

    if (searchQuery) {
      currentPersonalTasks = currentPersonalTasks.filter(
        (task) =>
          task.title.toLowerCase().includes(lowerCaseSearchTerm) ||
          task.description.toLowerCase().includes(lowerCaseSearchTerm) ||
          task.assignedTo.name.toLowerCase().includes(lowerCaseSearchTerm) ||
          task.assignedBy.name.toLowerCase().includes(lowerCaseSearchTerm) ||
          (task.lead?.name && task.lead.name.toLowerCase().includes(lowerCaseSearchTerm)) ||
          (task.company && task.company.toLowerCase().includes(lowerCaseSearchTerm)),
      );
      currentAssignedTasks = currentAssignedTasks.filter(
        (task) =>
          task.title.toLowerCase().includes(lowerCaseSearchTerm) ||
          task.description.toLowerCase().includes(lowerCaseSearchTerm) ||
          task.assignedTo.name.toLowerCase().includes(lowerCaseSearchTerm) ||
          task.assignedBy.name.toLowerCase().includes(lowerCaseSearchTerm) ||
          (task.lead?.name && task.lead.name.toLowerCase().includes(lowerCaseSearchTerm)) ||
          (task.company && task.company.toLowerCase().includes(lowerCaseSearchTerm)),
      );
    }

    const tasksPerPage = 10;
    const paginatedPersonalTasks = currentPersonalTasks.slice(
      personalTasksPage * tasksPerPage,
      (personalTasksPage + 1) * tasksPerPage,
    );
    const paginatedAssignedTasks = currentAssignedTasks.slice(
      personalTasksPage * tasksPerPage,
      (personalTasksPage + 1) * tasksPerPage,
    );

    setPersonalTasks(paginatedPersonalTasks);
    setAssignedTasks(paginatedAssignedTasks);
    setPersonalTasksTotalPages(
      Math.ceil((currentPersonalTasks.length + currentAssignedTasks.length) / tasksPerPage),
    );

    // Filter employee tasks
    let currentEmployeeTasks = [...allRawEmployeeTasks];

    if (priorityFilter) {
      currentEmployeeTasks = currentEmployeeTasks.filter((task) => task.priority === priorityFilter);
    }

    if (searchQuery) {
      currentEmployeeTasks = currentEmployeeTasks.filter(
        (task) =>
          task.title.toLowerCase().includes(lowerCaseSearchTerm) ||
          task.description.toLowerCase().includes(lowerCaseSearchTerm) ||
          task.assignedTo.name.toLowerCase().includes(lowerCaseSearchTerm) ||
          task.assignedBy.name.toLowerCase().includes(lowerCaseSearchTerm) ||
          (task.lead?.name && task.lead.name.toLowerCase().includes(lowerCaseSearchTerm)) ||
          (task.company && task.company.toLowerCase().includes(lowerCaseSearchTerm)),
      );
    }

    const paginatedEmployeeTasks = currentEmployeeTasks.slice(
      employeeTasksPage * tasksPerPage,
      (employeeTasksPage + 1) * tasksPerPage,
    );

    setEmployeeTasks(paginatedEmployeeTasks);
    setEmployeeTasksTotalPages(Math.ceil(currentEmployeeTasks.length / tasksPerPage));

  }, [
    allRawPersonalTasks,
    allRawAssignedTasks,
    allRawEmployeeTasks,
    personalTasksPage,
    employeeTasksPage,
    searchQuery, // Use single searchQuery
    priorityFilter,
  ]);

  // Wrap handleCreateTask in useCallback
  const handleCreateTask = useCallback(async () => {
    if (!newTask.title.trim()) {
      setError("Title is required");
      return;
    }
    if (!newTask.description.trim()) {
      setError("Description is required");
      return;
    }
    if (!newTask.dueDate) {
      setError("Due date is required");
      return;
    }
    if (newTask.taskType === "employee" && !newTask.assignedToId) {
      setError("Employee selection is required for assigned tasks");
      return;
    }
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/Tasks/addTask`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          ...newTask,
          dueDate: newTask.dueDate ? `${newTask.dueDate}T00:00:00` : null,
          leadId: newTask.leadId ? Number(newTask.leadId) : null,
          assignedToId: newTask.taskType === "employee" ? Number(newTask.assignedToId) : currentUserId,
          assignedById: currentUserId,
        }),
      })
      if (!response.ok) throw new Error(`Create task failed: ${response.status}`)
      await response.json()
      // Re-fetch all tasks after creation to update the client-side state
      await fetchAllTasks(leads) // Use the latest 'leads' state

      setNewTask({
        title: "",
        description: "",
        status: "TODO",
        priority: "LOW",
        dueDate: "",
        leadId: "",
        taskType: "personal",
        assignedToId: "",
      })
      setShowAddModal(false)
      setError("")
    } catch (err) {
      setError(`Failed to create task: ${(err as Error).message}`)
    }
  }, [newTask, currentUserId, fetchAllTasks, leads]); // Dependencies for handleCreateTask

  // Wrap handleUpdateTask in useCallback
  const handleUpdateTask = useCallback(async (task: Task, isEmployeeTask: boolean) => {
    try {
      const endpoint = isEmployeeTask
        ? `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/Manager/updateEmployeeTask/${task.id}`
        : `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/Tasks/TaskUpdate/${task.id}`
      const dueDateFormatted = task.dueDate.includes("T") ? task.dueDate : `${task.dueDate.split("T")[0]}T00:00:00`
      const response = await fetch(endpoint, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          title: task.title,
          description: task.description,
          status: task.status,
          priority: task.priority,
          dueDate: dueDateFormatted,
          leadId: task.lead ? Number(task.lead.id) : null,
          assignedToId: task.assignedToId,
          assignedById: task.assignedById,
        }),
      })
      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(errorText || "Failed to update task")
      }
      await response.text()
      // Re-fetch all tasks after update to ensure client-side state is consistent
      await fetchAllTasks(leads) // Use the latest 'leads' state

      setEditingTask(null)
      setError("")
    } catch (err) {
      setError(`Failed to update task: ${(err as Error).message}`)
      console.error("Update task error:", err)
    }
  }, [fetchAllTasks, leads]); // Dependencies for handleUpdateTask

  // Wrap handleDeleteTask in useCallback
  const handleDeleteTask = useCallback(async (taskId: number, isAssignedTask: boolean, isEmployeeTask: boolean) => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/Tasks/deleteTask/${taskId}`, {
        method: "DELETE",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
      })
      if (!response.ok) throw new Error(`Delete task failed: ${response.status}`)
      // Re-fetch all tasks after deletion to ensure client-side state is consistent
      await fetchAllTasks(leads) // Use the latest 'leads' state

      setError("")
    } catch (err) {
      setError(`Failed to delete task: ${(err as Error).message}`)
    }
  }, [fetchAllTasks, leads]); // Dependencies for handleDeleteTask

  const handleTaskRowClick = (task: Task, event: React.MouseEvent) => {
    // Prevent opening modal if clicking on action buttons
    if ((event.target as HTMLElement).closest("button")) {
      return
    }
    setViewingTask(task)
  }

  const isModalOpen = showAddModal || editingTask !== null || viewingTask !== null

  if (loading && allRawPersonalTasks.length === 0 && allRawEmployeeTasks.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
        <Navbar role="manager" />
        <div className="text-center p-16 bg-white/60 backdrop-blur-sm rounded-3xl shadow-xl border border-white/20 container mx-auto">
          <div className="relative inline-flex items-center justify-center w-16 h-16 mb-6">
            <div className="absolute inset-0 rounded-full border-4 border-indigo-200 animate-pulse"></div>
            <div className="absolute inset-0 rounded-full border-t-4 border-indigo-600 animate-spin"></div>
          </div>
          <h3 className="text-xl font-semibold text-slate-700 mb-2">Loading Task Data</h3>
          <p className="text-slate-500">Please wait while we fetch your tasks...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      <Navbar role="manager" />

      {/* Main Content with Blur Effect */}
      <div className={`transition-all duration-500 ${isModalOpen ? "blur-sm scale-95" : ""}`}>
        {/* Hero Section */}
        <div className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-indigo-600/10 to-purple-600/10"></div>
          <div className="relative container mx-auto px-6 pt-12 pb-8">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-indigo-800 via-purple-700 to-blue-800 bg-clip-text text-transparent mb-4">
                  Manager Tasks Dashboard
                </h1>
                <p className="text-lg text-slate-600 font-medium">Manage and track tasks for yourself and your team</p>
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
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              {/* Unified Search Bar */}
              <div className="relative flex-grow mr-4">
                <input
                  type="text"
                  placeholder="Search all tasks..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value)
                    setPersonalTasksPage(0) // Reset to first page on search
                    setEmployeeTasksPage(0) // Reset to first page on search
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
                {/* Priority Filter */}
                <div className="relative group">
                  <select
                    className="appearance-none bg-white/90 backdrop-blur-sm border border-slate-200 rounded-xl px-6 py-3 pr-12 font-medium text-slate-700 shadow-lg hover:shadow-xl transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent group-hover:border-indigo-300"
                    value={priorityFilter}
                    onChange={(e) => {
                      setPriorityFilter(e.target.value as "LOW" | "MEDIUM" | "HIGH" | "URGENT" | "")
                      setPersonalTasksPage(0) // Reset to first page on filter change
                      setEmployeeTasksPage(0) // Reset to first page on filter change
                    }}
                  >
                    <option value="">All Priorities</option>
                    <option value="LOW">Low</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HIGH">High</option>
                    <option value="URGENT">Urgent</option>
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

                <div className="flex space-x-3">
                  <div className="text-sm text-slate-600 bg-slate-100/80 px-4 py-2 rounded-lg font-medium p-3 bg-gradient-to-r from-slate-100 to-slate-200 rounded-xl text-slate-800 font-semibold text-center group-hover:from-indigo-100 group-hover:to-purple-100 group-hover:text-indigo-800 transition-all duration-300 shadow-sm group-hover:shadow-md">
                    {personalTasks.length} Personal {personalTasks.length === 1 ? "Task" : "Tasks"}
                  </div>
                  <div className="text-sm text-slate-600 bg-slate-100/80 px-4 py-2 rounded-lg font-medium p-3 bg-gradient-to-r from-slate-100 to-slate-200 rounded-xl text-slate-800 font-semibold text-center group-hover:from-indigo-100 group-hover:to-purple-100 group-hover:text-indigo-800 transition-all duration-300 shadow-sm group-hover:shadow-md">
                    {employeeTasks.length} Employee {employeeTasks.length === 1 ? "Task" : "Tasks"}
                  </div>
                </div>
              </div>
              <button
                onClick={() => setShowAddModal(true)}
                className="group relative overflow-hidden bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-8 py-4 rounded-2xl hover:from-indigo-700 hover:to-purple-700 transition-all duration-300 shadow-xl hover:shadow-indigo-500/50 transform hover:scale-105 font-semibold text-lg backdrop-blur-sm"
              >
                <span className="relative z-10 flex items-center gap-3">
                  <svg
                    className="w-5 h-5 group-hover:rotate-90 transition-transform duration-300"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Add New Task
                </span>
                <div className="absolute inset-0 bg-gradient-to-r from-indigo-400 to-purple-400 opacity-0 group-hover:opacity-30 transition-opacity duration-300"></div>
              </button>
            </div>
          </div>

          {/* Personal & Assigned Tasks Section */}
          <div className="mb-12">
            <h2 className="text-3xl font-bold text-slate-800 mb-6 bg-clip-text text-transparent bg-gradient-to-r from-indigo-700 to-purple-700">
              Your Tasks
            </h2>
            <div className="bg-white/80 backdrop-blur-sm border border-white/20 rounded-2xl shadow-xl overflow-hidden">
              <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-blue-600 p-6">
                <div className="flex items-center gap-3">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                    />
                  </svg>
                  <h3 className="text-xl font-bold text-white">Personal & Assigned Tasks</h3>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-200">
                  <thead className="bg-gradient-to-r from-slate-50 to-indigo-50">
                    <tr>
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
                  <tbody className="bg-white divide-y divide-slate-200">
                    {[...personalTasks, ...assignedTasks].length > 0 ? (
                      [...personalTasks, ...assignedTasks].map((task, index) => (
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
                                onClick={() => setEditingTask(task)}
                                className="group relative overflow-hidden bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-4 py-2 rounded-xl hover:from-indigo-700 hover:to-purple-700 transition-all duration-300 transform hover:scale-105 shadow-sm hover:shadow-md font-semibold"
                              >
                                <span className="relative z-10">Edit</span>
                                <div className="absolute inset-0 bg-gradient-to-r from-indigo-400 to-purple-400 opacity-0 group-hover:opacity-30 transition-opacity duration-300"></div>
                              </button>
                              <button
                                onClick={() => handleDeleteTask(task.id, false, false)}
                                className="group relative overflow-hidden bg-gradient-to-r from-rose-600 to-red-600 text-white px-4 py-2 rounded-xl hover:from-rose-700 hover:to-red-700 transition-all duration-300 transform hover:scale-105 shadow-sm hover:shadow-md font-semibold"
                              >
                                <span className="relative z-10">Delete</span>
                                <div className="absolute inset-0 bg-gradient-to-r from-rose-400 to-red-400 opacity-0 group-hover:opacity-30 transition-opacity duration-300"></div>
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={7} className="text-center py-8 text-slate-500 font-medium">
                          No personal or assigned tasks found.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
              {/* Personal Tasks Pagination */}
              {personalTasksTotalPages > 1 && !searchQuery && ( // Hide pagination when searching
                <div className="bg-gradient-to-r from-slate-50 via-indigo-50 to-purple-50 px-6 py-8 border-t border-slate-200">
                  <div className="flex flex-col lg:flex-row items-center justify-between gap-6">
                    <button
                      onClick={() => setPersonalTasksPage((prev) => Math.max(prev - 1, 0))}
                      disabled={personalTasksPage === 0}
                      className="group relative overflow-hidden bg-white/80 backdrop-blur-sm text-slate-700 px-6 py-3 rounded-xl hover:bg-gradient-to-r hover:from-indigo-50 hover:to-purple-50 hover:text-indigo-700 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105 font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <span className="relative z-10">Previous</span>
                      <div className="absolute inset-0 bg-gradient-to-r from-indigo-400 to-purple-400 opacity-0 group-hover:opacity-20 transition-opacity duration-300"></div>
                    </button>
                    <div className="flex items-center flex-wrap justify-center gap-2">
                      {renderPaginationNumbers(personalTasksPage, personalTasksTotalPages, setPersonalTasksPage)}
                    </div>
                    <button
                      onClick={() => setPersonalTasksPage((prev) => Math.min(prev + 1, personalTasksTotalPages - 1))}
                      disabled={personalTasksPage === personalTasksTotalPages - 1}
                      className="group relative overflow-hidden bg-white/80 backdrop-blur-sm text-slate-700 px-6 py-3 rounded-xl hover:bg-gradient-to-r hover:from-indigo-50 hover:to-purple-50 hover:text-indigo-700 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105 font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <span className="relative z-10">Next</span>
                      <div className="absolute inset-0 bg-gradient-to-r from-indigo-400 to-purple-400 opacity-0 group-hover:opacity-20 transition-opacity duration-300"></div>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Assigned Tasks */}
          {assignedTasks.length > 0 && (
            <div className="mb-8 bg-white/80 backdrop-blur-sm border border-white/20 rounded-2xl shadow-xl overflow-hidden">
              <div className="bg-gradient-to-r from-purple-600 via-blue-600 to-indigo-600 p-6">
                <div className="flex items-center gap-3">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M8 7v8m4-4v4m4-4v4m6 1H2a2 2 0 01-2-2V5a2 2 0 012-2h3.93a2 2 0 011.664.89l.812 1.22A2 2 0 0010.532 8h2.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0118.07 3H22a2 2 0 012 2v10a2 2 0 01-2 2z"
                    />
                  </svg>
                  <h2 className="text-2xl font-bold text-white">Assigned Tasks ({assignedTasks.length})</h2>
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
                        Description
                      </th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-slate-900 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-slate-900 uppercase tracking-wider">
                        Priority
                      </th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-slate-900 uppercase tracking-wider">
                        Due Date
                      </th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-slate-900 uppercase tracking-wider">
                        Assigned By
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
                        <td className="px-6 py-4 max-w-xs">
                          <div className="p-3 bg-gradient-to-r from-slate-100 to-slate-200 rounded-xl text-slate-700 font-medium group-hover:from-indigo-100 group-hover:to-purple-100 group-hover:text-indigo-800 transition-all duration-300 shadow-sm group-hover:shadow-md whitespace-pre-wrap">
                            {task.description.length > 100
                              ? `${task.description.substring(0, 100)}...`
                              : task.description}
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
                          <div className="p-3 bg-gradient-to-r from-slate-100 to-slate-200 rounded-xl text-slate-700 font-medium text-center group-hover:from-indigo-100 group-hover:to-purple-100 group-hover:text-indigo-800 transition-all duration-300 shadow-sm group-hover:shadow-md">
                            {new Date(task.dueDate.split("T")[0]).toLocaleDateString()}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="p-3 bg-gradient-to-r from-slate-100 to-slate-200 rounded-xl text-slate-800 font-semibold text-center group-hover:from-indigo-100 group-hover:to-purple-100 group-hover:text-indigo-800 transition-all duration-300 shadow-sm group-hover:shadow-md">
                            {task.assignedBy.name}
                          </div>
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
                              onClick={() => setEditingTask(task)}
                              className="group relative overflow-hidden bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-4 py-2 rounded-xl hover:from-indigo-700 hover:to-purple-700 transition-all duration-300 transform hover:scale-105 shadow-sm hover:shadow-md font-semibold"
                            >
                              <span className="relative z-10">Edit</span>
                              <div className="absolute inset-0 bg-gradient-to-r from-indigo-400 to-purple-400 opacity-0 group-hover:opacity-30 transition-opacity duration-300"></div>
                            </button>
                            <button
                              onClick={() => handleDeleteTask(task.id, true, false)}
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
            </div>
          )}

          {/* Employee Tasks */}
          <div className="bg-white/80 backdrop-blur-sm border border-white/20 rounded-2xl shadow-xl overflow-hidden">
            <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 p-6">
              <div className="flex items-center gap-3">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17 20h-2v-4h-2V7a4 4 0 00-8 0v12h2v4H7M7 12H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2h-2m-4 0v4m-4-4h.01"
                  />
                </svg>
                <h2 className="text-2xl font-bold text-white">Employee Tasks ({employeeTasks.length})</h2>
              </div>
            </div>
            {employeeTasks.length === 0 && !searchQuery && !priorityFilter ? (
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
                    d="M17 20h-2v-4h-2V7a4 4 0 00-8 0v12h2v4H7M7 12H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2h-2m-4 0v4m-4-4h.01"
                  />
                </svg>
                <h3 className="mt-2 text-xl font-semibold text-slate-700">No employee tasks yet</h3>
                <p className="mt-1 text-slate-500">Assign tasks to your employees to get started.</p>
              </div>
            ) : employeeTasks.length === 0 && (searchQuery || priorityFilter) ? (
                <div className="text-center p-16 bg-white/60 backdrop-blur-sm rounded-3xl shadow-xl border border-white/20">
                    <h3 className="mt-2 text-xl font-semibold text-slate-700">No employee tasks match your search/filter.</h3>
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
                          Assigned To
                        </th>
                        <th className="px-6 py-4 text-left text-sm font-semibold text-slate-900 uppercase tracking-wider">
                          Assigned By
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
                      {employeeTasks.map((task, index) => (
                        <tr
                          key={`employee-task-${task.id}`}
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
                          {/* <td className="px-6 py-4 max-w-xs">
                            <div className="p-3 bg-gradient-to-r from-slate-100 to-slate-200 rounded-xl text-slate-700 font-medium group-hover:from-indigo-100 group-hover:to-purple-100 group-hover:text-indigo-800 transition-all duration-300 shadow-sm group-hover:shadow-md whitespace-pre-wrap">
                              {task.description.length > 100
                                ? `${task.description.substring(0, 100)}...`
                                : task.description}
                            </div>
                          </td> */}
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
                          {/* <td className="px-6 py-4">
                            <div className="p-3 bg-gradient-to-r from-slate-100 to-slate-200 rounded-xl text-slate-700 font-medium text-center group-hover:from-indigo-100 group-hover:to-purple-100 group-hover:text-indigo-800 transition-all duration-300 shadow-sm group-hover:shadow-md">
                              {new Date(task.dueDate.split("T")[0]).toLocaleDateString()}
                            </div>
                          </td> */}
                          <td className="px-6 py-4">
                            <div className="p-3 bg-gradient-to-r from-slate-100 to-slate-200 rounded-xl text-slate-800 font-semibold text-center group-hover:from-indigo-100 group-hover:to-purple-100 group-hover:text-indigo-800 transition-all duration-300 shadow-sm group-hover:shadow-md">
                              {task.assignedTo.name}
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="p-3 bg-gradient-to-r from-slate-100 to-slate-200 rounded-xl text-slate-800 font-semibold text-center group-hover:from-indigo-100 group-hover:to-purple-100 group-hover:text-indigo-800 transition-all duration-300 shadow-sm group-hover:shadow-md">
                              {task.assignedBy.name}
                            </div>
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
                                onClick={() => setEditingTask(task)}
                                className="group relative overflow-hidden bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-4 py-2 rounded-xl hover:from-indigo-700 hover:to-purple-700 transition-all duration-300 transform hover:scale-105 shadow-sm hover:shadow-md font-semibold"
                              >
                                <span className="relative z-10">Edit</span>
                                <div className="absolute inset-0 bg-gradient-to-r from-indigo-400 to-purple-400 opacity-0 group-hover:opacity-30 transition-opacity duration-300"></div>
                              </button>
                              <button
                                onClick={() => handleDeleteTask(task.id, false, true)}
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
                {/* Employee Tasks Pagination */}
                {employeeTasksTotalPages > 1 && !searchQuery && ( // Hide pagination when searching
                  <div className="bg-gradient-to-r from-slate-50 via-indigo-50 to-purple-50 px-6 py-8 border-t border-slate-200">
                    <div className="flex flex-col lg:flex-row items-center justify-between gap-6">
                      <button
                        onClick={() => setEmployeeTasksPage((prev) => Math.max(prev - 1, 0))}
                        disabled={employeeTasksPage === 0}
                        className="group relative overflow-hidden bg-white/80 backdrop-blur-sm text-slate-700 px-6 py-3 rounded-xl hover:bg-gradient-to-r hover:from-indigo-50 hover:to-purple-50 hover:text-indigo-700 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105 font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <span className="relative z-10">Previous</span>
                        <div className="absolute inset-0 bg-gradient-to-r from-indigo-400 to-purple-400 opacity-0 group-hover:opacity-20 transition-opacity duration-300"></div>
                      </button>
                      <div className="flex items-center flex-wrap justify-center gap-2">
                        {renderPaginationNumbers(employeeTasksPage, employeeTasksTotalPages, setEmployeeTasksPage)}
                      </div>
                      <button
                        onClick={() => setEmployeeTasksPage((prev) => Math.min(prev + 1, employeeTasksTotalPages - 1))}
                        disabled={employeeTasksPage === employeeTasksTotalPages - 1}
                        className="group relative overflow-hidden bg-white/80 backdrop-blur-sm text-slate-700 px-6 py-3 rounded-xl hover:bg-gradient-to-r hover:from-indigo-50 hover:to-purple-50 hover:text-indigo-700 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105 font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <span className="relative z-10">Next</span>
                        <div className="absolute inset-0 bg-gradient-to-r from-indigo-400 to-purple-400 opacity-0 group-hover:opacity-20 transition-opacity duration-300"></div>
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* Modals */}
      {/* {showAddModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm overflow-y-auto h-full w-full z-50 flex items-center justify-center p-4">
          <div className="relative w-full max-w-2xl bg-white/95 backdrop-blur-lg rounded-3xl shadow-2xl border border-white/30 animate-in fade-in zoom-in duration-300">
            <div className="flex items-center justify-between p-6 border-b border-slate-200">
              <h3 className="text-2xl font-bold bg-gradient-to-r from-indigo-800 to-purple-800 bg-clip-text text-transparent">
                Add New Task
              </h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-black hover:text-indigo-600 transition-colors duration-300 p-2 hover:bg-slate-100 rounded-xl"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
              <div>
                <label className="block text-sm font-semibold text-black mb-2">Title *</label>
                <input
                  type="text"
                  value={newTask.title}
                  onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                  className="w-full p-3 rounded-xl border border-slate-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-300 shadow-sm"
                  placeholder="Task title"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-black mb-2">Description *</label>
                <textarea
                  value={newTask.description}
                  onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
                  className="w-full p-3 rounded-xl border border-slate-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-300 shadow-sm h-32 resize-none"
                  placeholder="Detailed description of the task"
                ></textarea>
              </div>
              <div>
                <label className="block text-sm font-semibold text-black mb-2">Due Date *</label>
                <input
                  type="date"
                  value={newTask.dueDate}
                  onChange={(e) => setNewTask({ ...newTask, dueDate: e.target.value })}
                  className="w-full p-3 rounded-xl border border-slate-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-300 shadow-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-black mb-2">Status</label>
                <select
                  value={newTask.status}
                  onChange={(e) => setNewTask({ ...newTask, status: e.target.value as any })}
                  className="w-full p-3 rounded-xl border border-slate-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-300 shadow-sm bg-white"
                >
                  <option value="TODO">To Do</option>
                  <option value="IN_PROGRESS">In Progress</option>
                  <option value="DONE">Done</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-black mb-2">Priority</label>
                <select
                  value={newTask.priority}
                  onChange={(e) => setNewTask({ ...newTask, priority: e.target.value as any })}
                  className="w-full p-3 rounded-xl border border-slate-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-300 shadow-sm bg-white"
                >
                  <option value="LOW">Low</option>
                  <option value="MEDIUM">Medium</option>
                  <option value="HIGH">High</option>
                  <option value="URGENT">Urgent</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-black mb-2">Task Type</label>
                <select
                  value={newTask.taskType}
                  onChange={(e) => setNewTask({ ...newTask, taskType: e.target.value as any })}
                  className="w-full p-3 rounded-xl border border-slate-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-300 shadow-sm bg-white"
                >
                  <option value="personal">Personal Task</option>
                  <option value="employee">Assign to Employee</option>
                </select>
              </div>

              {newTask.taskType === "employee" && (
                <div>
                  <label className="block text-sm font-semibold text-black mb-2">Assign to Employee</label>
                  <select
                    value={newTask.assignedToId}
                    onChange={(e) => setNewTask({ ...newTask, assignedToId: e.target.value })}
                    className="w-full p-3 rounded-xl border border-slate-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-300 shadow-sm bg-white"
                  >
                    <option value="">Select Employee</option>
                    {employees.map((employee) => (
                      <option key={employee.id} value={employee.id}>
                        {employee.name} ({employee.username})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="block text-sm font-semibold text-black mb-2">Associate with Lead (Optional)</label>
                <select
                  value={newTask.leadId}
                  onChange={(e) => setNewTask({ ...newTask, leadId: e.target.value })}
                  className="w-full p-3 rounded-xl border border-slate-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-300 shadow-sm bg-white"
                >
                  <option value="">No Lead</option>
                  {leads.map((lead) => (
                    <option key={lead.id} value={lead.id}>
                      {lead.name} {lead.company ? `(${lead.company})` : ""}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="p-6 bg-slate-50 border-t border-slate-200 flex justify-end gap-3 rounded-b-3xl">
              <button
                onClick={() => setShowAddModal(false)}
                className="group relative overflow-hidden bg-white text-black px-6 py-3 rounded-xl hover:bg-slate-50 transition-all duration-300 shadow-xl hover:shadow-slate-200/50 transform hover:scale-105 font-semibold border border-slate-200"
              >
                <span className="relative z-10">Cancel</span>
                <div className="absolute inset-0 bg-gradient-to-r from-indigo-400 to-purple-400 opacity-0 group-hover:opacity-20 transition-opacity duration-300"></div>
              </button>
              <button
                onClick={handleCreateTask}
                className="group relative overflow-hidden bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-6 py-3 rounded-xl hover:from-indigo-700 hover:to-purple-700 transition-all duration-300 shadow-xl hover:shadow-indigo-500/50 transform hover:scale-105 font-semibold"
              >
                <span className="relative z-10">Create Task</span>
                <div className="absolute inset-0 bg-gradient-to-r from-indigo-400 to-purple-400 opacity-0 group-hover:opacity-30 transition-opacity duration-300"></div>
              </button>
            </div>
          </div>
        </div>
      )}

      {editingTask && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm overflow-y-auto h-full w-full z-50 flex items-center justify-center p-4">
          <div className="relative w-full max-w-2xl bg-white/95 backdrop-blur-lg rounded-3xl shadow-2xl border border-white/30 animate-in fade-in zoom-in duration-300">
            <div className="flex items-center justify-between p-6 border-b border-slate-200">
              <h3 className="text-2xl font-bold bg-gradient-to-r from-indigo-800 to-purple-800 bg-clip-text text-transparent">
                Edit Task
              </h3>
              <button onClick={() => setEditingTask(null)} className="text-slate-400 hover:text-indigo-600 transition-colors duration-300 p-2 hover:bg-slate-100 rounded-xl">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
              <div>
                <label className="block text-sm font-semibold text-slate-800 mb-2">Title *</label>
                <input
                  type="text"
                  value={editingTask.title}
                  onChange={(e) => setEditingTask({ ...editingTask, title: e.target.value })}
                  className="w-full p-3 rounded-xl border border-slate-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-300 shadow-sm"
                  placeholder="Task title"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-800 mb-2">Description *</label>
                <textarea
                  value={editingTask.description}
                  onChange={(e) => setEditingTask({ ...editingTask, description: e.target.value })}
                  className="w-full p-3 rounded-xl border border-slate-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-300 shadow-sm h-32 resize-none"
                  placeholder="Detailed description of the task"
                ></textarea>
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-800 mb-2">Due Date *</label>
                <input
                  type="date"
                  value={editingTask.dueDate ? editingTask.dueDate.split('T')[0] : ''}
                  onChange={(e) => setEditingTask({ ...editingTask, dueDate: e.target.value })}
                  className="w-full p-3 rounded-xl border border-slate-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-300 shadow-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-800 mb-2">Status</label>
                <select
                  value={editingTask.status}
                  onChange={(e) => setEditingTask({ ...editingTask, status: e.target.value as any })}
                  className="w-full p-3 rounded-xl border border-slate-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-300 shadow-sm bg-white"
                >
                  <option value="TODO">To Do</option>
                  <option value="IN_PROGRESS">In Progress</option>
                  <option value="DONE">Done</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-800 mb-2">Priority</label>
                <select
                  value={editingTask.priority}
                  onChange={(e) => setEditingTask({ ...editingTask, priority: e.target.value as any })}
                  className="w-full p-3 rounded-xl border border-slate-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-300 shadow-sm bg-white"
                >
                  <option value="LOW">Low</option>
                  <option value="MEDIUM">Medium</option>
                  <option value="HIGH">High</option>
                  <option value="URGENT">Urgent</option>
                </select>
              </div>
              {(editingTask.assignedToId !== currentUserId || editingTask.assignedById !== currentUserId) && (
                <div>
                  <label className="block text-sm font-semibold text-slate-800 mb-2">Assigned To</label>
                  <select
                    value={editingTask.assignedToId}
                    onChange={(e) => setEditingTask({ ...editingTask, assignedToId: Number(e.target.value) })}
                    className="w-full p-3 rounded-xl border border-slate-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-300 shadow-sm bg-white"
                  >
                    {employees.map((employee) => (
                      <option key={employee.id} value={employee.id}>
                        {employee.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}
              <div>
                <label className="block text-sm font-semibold text-slate-800 mb-2">Associate with Lead (Optional)</label>
                <select
                  value={editingTask.lead?.id || ""}
                  onChange={(e) => {
                    const selectedLeadId = Number(e.target.value);
                    const foundLead = leads.find((l) => l.id === selectedLeadId);
                    setEditingTask({
                      ...editingTask,
                      lead: e.target.value ? (foundLead || null) : null, // Ensure null if not found or empty
                    });
                  }}
                  className="w-full p-3 rounded-xl border border-slate-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-300 shadow-sm bg-white"
                >
                  <option value="">No Lead</option>
                  {leads.map((lead) => (
                    <option key={lead.id} value={lead.id}>
                      {lead.name} {lead.company ? `(${lead.company})` : ""}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="p-6 bg-slate-50 border-t border-slate-200 flex justify-end gap-3 rounded-b-3xl">
              <button
                onClick={() => setEditingTask(null)}
                className="group relative overflow-hidden bg-white text-slate-800 px-6 py-3 rounded-xl hover:bg-slate-50 transition-all duration-300 shadow-xl hover:shadow-slate-200/50 transform hover:scale-105 font-semibold border border-slate-200"
              >
                <span className="relative z-10">Cancel</span>
                <div className="absolute inset-0 bg-gradient-to-r from-indigo-400 to-purple-400 opacity-0 group-hover:opacity-20 transition-opacity duration-300"></div>
              </button>
              <button
                onClick={() =>
                  handleUpdateTask(
                    editingTask,
                    allRawEmployeeTasks.some((t) => t.id === editingTask.id), // Check against allRawEmployeeTasks
                  )
                }
                className="group relative overflow-hidden bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-6 py-3 rounded-xl hover:from-indigo-700 hover:to-purple-700 transition-all duration-300 shadow-xl hover:shadow-indigo-500/50 transform hover:scale-105 font-semibold"
              >
                <span className="relative z-10">Save Changes</span>
                <div className="absolute inset-0 bg-gradient-to-r from-indigo-400 to-purple-400 opacity-0 group-hover:opacity-30 transition-opacity duration-300"></div>
              </button>
            </div>
          </div>
        </div>
      )} */}
      {showAddModal && (
  <div className="fixed inset-0 bg-black/60 backdrop-blur-sm overflow-y-auto h-full w-full z-50 flex items-center justify-center p-4">
    <div className="relative w-full max-w-2xl bg-white/95 backdrop-blur-lg rounded-3xl shadow-2xl border border-white/30 animate-in fade-in zoom-in duration-300">
      <div className="flex items-center justify-between p-6 border-b border-slate-200">
        <h3 className="text-2xl font-bold bg-gradient-to-r from-indigo-800 to-purple-800 bg-clip-text text-transparent">
          Add New Task
        </h3>
        <button
          onClick={() => setShowAddModal(false)}
          className="text-black hover:text-indigo-600 transition-colors duration-300 p-2 hover:bg-slate-100 rounded-xl"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
      <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
        <div>
          <label className="block text-sm font-semibold text-black mb-2">Title *</label>
          <input
            type="text"
            value={newTask.title}
            onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
            className="w-full p-3 rounded-xl border border-slate-300 text-black focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-300 shadow-sm"
            placeholder="Task title"
          />
        </div>
        <div>
          <label className="block text-sm font-semibold text-black mb-2">Description *</label>
          <textarea
            value={newTask.description}
            onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
            className="w-full p-3 rounded-xl border border-slate-300 text-black focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-300 shadow-sm h-32 resize-none"
            placeholder="Detailed description of the task"
          ></textarea>
        </div>
        <div>
          <label className="block text-sm font-semibold text-black mb-2">Due Date *</label>
          <input
            type="date"
            value={newTask.dueDate}
            onChange={(e) => setNewTask({ ...newTask, dueDate: e.target.value })}
            className="w-full p-3 rounded-xl border border-slate-300 text-black focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-300 shadow-sm"
          />
        </div>
        <div>
          <label className="block text-sm font-semibold text-black mb-2">Status</label>
          <select
            value={newTask.status}
            onChange={(e) => setNewTask({ ...newTask, status: e.target.value as any })}
            className="w-full p-3 rounded-xl border border-slate-300 text-black focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-300 shadow-sm bg-white"
          >
            <option value="TODO">To Do</option>
            <option value="IN_PROGRESS">In Progress</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-semibold text-black mb-2">Priority</label>
          <select
            value={newTask.priority}
            onChange={(e) => setNewTask({ ...newTask, priority: e.target.value as any })}
            className="w-full p-3 rounded-xl border border-slate-300 text-black focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-300 shadow-sm bg-white"
          >
            <option value="LOW">Low</option>
            <option value="MEDIUM">Medium</option>
            <option value="HIGH">High</option>
            <option value="URGENT">Urgent</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-semibold text-black mb-2">Task Type</label>
          <select
            value={newTask.taskType}
            onChange={(e) => setNewTask({ ...newTask, taskType: e.target.value as any })}
            className="w-full p-3 rounded-xl border border-slate-300 text-black focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-300 shadow-sm bg-white"
          >
            <option value="personal">Personal Task</option>
            <option value="employee">Assign to Employee</option>
          </select>
        </div>

        {newTask.taskType === "employee" && (
          <div>
            <label className="block text-sm font-semibold text-black mb-2">Assign to Employee</label>
            <select
              value={newTask.assignedToId}
              onChange={(e) => setNewTask({ ...newTask, assignedToId: e.target.value })}
              className="w-full p-3 rounded-xl border border-slate-300 text-black focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-300 shadow-sm bg-white"
            >
              <option value="">Select Employee</option>
              {employees.map((employee) => (
                <option key={employee.id} value={employee.id}>
                  {employee.name} ({employee.username})
                </option>
              ))}
            </select>
          </div>
        )}

        <div>
          <label className="block text-sm font-semibold text-black mb-2">Associate with Lead (Optional)</label>
          <select
            value={newTask.leadId}
            onChange={(e) => setNewTask({ ...newTask, leadId: e.target.value })}
            className="w-full p-3 rounded-xl border border-slate-300 text-black focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-300 shadow-sm bg-white"
          >
            <option value="">No Lead</option>
            {leads.map((lead) => (
              <option key={lead.id} value={lead.id}>
                {lead.name} {lead.company ? `(${lead.company})` : ""}
              </option>
            ))}
          </select>
        </div>
      </div>
      {/* Footer buttons remain unchanged */}
    </div>
  </div>
)}

{editingTask && (
  <div className="fixed inset-0 bg-black/60 backdrop-blur-sm overflow-y-auto h-full w-full z-50 flex items-center justify-center p-4">
    <div className="relative w-full max-w-2xl bg-white/95 backdrop-blur-lg rounded-3xl shadow-2xl border border-white/30 animate-in fade-in zoom-in duration-300">
      <div className="flex items-center justify-between p-6 border-b border-slate-200">
        <h3 className="text-2xl font-bold bg-gradient-to-r from-indigo-800 to-purple-800 bg-clip-text text-transparent">
          Edit Task
        </h3>
        <button onClick={() => setEditingTask(null)} className="text-slate-400 hover:text-indigo-600 transition-colors duration-300 p-2 hover:bg-slate-100 rounded-xl">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
      <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
        <div>
          <label className="block text-sm font-semibold text-black mb-2">Title *</label>
          <input
            type="text"
            value={editingTask.title}
            onChange={(e) => setEditingTask({ ...editingTask, title: e.target.value })}
            className="w-full p-3 rounded-xl border border-slate-300 text-black focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-300 shadow-sm"
            placeholder="Task title"
          />
        </div>
        <div>
          <label className="block text-sm font-semibold text-black mb-2">Description *</label>
          <textarea
            value={editingTask.description}
            onChange={(e) => setEditingTask({ ...editingTask, description: e.target.value })}
            className="w-full p-3 rounded-xl border border-slate-300 text-black focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-300 shadow-sm h-32 resize-none"
            placeholder="Detailed description of the task"
          ></textarea>
        </div>
        <div>
          <label className="block text-sm font-semibold text-black mb-2">Due Date *</label>
          <input
            type="date"
            value={editingTask.dueDate ? editingTask.dueDate.split("T")[0] : ""}
            onChange={(e) => setEditingTask({ ...editingTask, dueDate: e.target.value })}
            className="w-full p-3 rounded-xl border border-slate-300 text-black focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-300 shadow-sm"
          />
        </div>
        <div>
          <label className="block text-sm font-semibold text-black mb-2">Status</label>
          <select
            value={editingTask.status}
            onChange={(e) => setEditingTask({ ...editingTask, status: e.target.value as any })}
            className="w-full p-3 rounded-xl border border-slate-300 text-black focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-300 shadow-sm bg-white"
          >
            <option value="TODO">To Do</option>
            <option value="IN_PROGRESS">In Progress</option>
            <option value="DONE">Done</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-semibold text-black mb-2">Priority</label>
          <select
            value={editingTask.priority}
            onChange={(e) => setEditingTask({ ...editingTask, priority: e.target.value as any })}
            className="w-full p-3 rounded-xl border border-slate-300 text-black focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-300 shadow-sm bg-white"
          >
            <option value="LOW">Low</option>
            <option value="MEDIUM">Medium</option>
            <option value="HIGH">High</option>
            <option value="URGENT">Urgent</option>
          </select>
        </div>
        {(editingTask.assignedToId !== currentUserId || editingTask.assignedById !== currentUserId) && (
          <div>
            <label className="block text-sm font-semibold text-black mb-2">Assigned To</label>
            <select
              value={editingTask.assignedToId}
              onChange={(e) => setEditingTask({ ...editingTask, assignedToId: Number(e.target.value) })}
              className="w-full p-3 rounded-xl border border-slate-300 text-black focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-300 shadow-sm bg-white"
            >
              {employees.map((employee) => (
                <option key={employee.id} value={employee.id}>
                  {employee.name}
                </option>
              ))}
            </select>
          </div>
        )}
        <div>
          <label className="block text-sm font-semibold text-black mb-2">Associate with Lead (Optional)</label>
          <select
            value={editingTask.lead?.id || ""}
            onChange={(e) => {
              const selectedLeadId = Number(e.target.value);
              const foundLead = leads.find((l) => l.id === selectedLeadId);
              setEditingTask({
                ...editingTask,
                lead: e.target.value ? foundLead || null : null,
              });
            }}
            className="w-full p-3 rounded-xl border border-slate-300 text-black focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-300 shadow-sm bg-white"
          >
            <option value="">No Lead</option>
            {leads.map((lead) => (
              <option key={lead.id} value={lead.id}>
                {lead.name} {lead.company ? `(${lead.company})` : ""}
              </option>
            ))}
          </select>
        </div>
      </div>
      {/* Footer buttons remain unchanged */}
    </div>
  </div>
)}


      {viewingTask && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm overflow-y-auto h-full w-full z-50 flex items-center justify-center p-4">
          <div className="relative w-full max-w-2xl bg-white/95 backdrop-blur-lg rounded-3xl shadow-2xl border border-white/30 animate-in fade-in zoom-in duration-300">
            <div className="flex items-center justify-between p-6 border-b border-slate-200">
              <h3 className="text-2xl font-bold bg-gradient-to-r from-indigo-800 to-purple-800 bg-clip-text text-transparent">
                Task Details
              </h3>
              <button onClick={() => setViewingTask(null)} className="text-slate-400 hover:text-indigo-600 transition-colors duration-300 p-2 hover:bg-slate-100 rounded-xl">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto text-slate-700">
              <p className="text-slate-900">
                <span className="font-semibold text-slate-800">Title:</span> {viewingTask.title}
              </p>
              <p className="text-slate-900">
                <span className="font-semibold text-slate-800">Description:</span> {viewingTask.description}
              </p>
              <p className="text-slate-900">
                <span className="font-semibold text-slate-800">Status:</span>{" "}
                <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold ${getStatusColor(viewingTask.status)}`}>
                  {viewingTask.status.replace("_", " ")}
                </span>
              </p>
              <p className="text-slate-900">
                <span className="font-semibold text-slate-800">Priority:</span>{" "}
                <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold ${getPriorityColor(viewingTask.priority)}`}>
                  {viewingTask.priority}
                </span>
              </p>
              <p className="text-slate-900">
                <span className="font-semibold text-slate-800">Due Date:</span> {new Date(viewingTask.dueDate.split("T")[0]).toLocaleDateString()}
              </p>
              <p className="text-slate-900">
                <span className="font-semibold text-slate-800">Created At:</span> {new Date(viewingTask.createdAt).toLocaleDateString()}
              </p>
              <p className="text-slate-900">
                <span className="font-semibold text-slate-800">Last Updated:</span> {new Date(viewingTask.updatedAt).toLocaleDateString()}
              </p>
              <p className="text-slate-900">
                <span className="font-semibold text-slate-800">Assigned To:</span> {viewingTask.assignedTo?.name || "N/A"}
              </p>
              <p className="text-slate-900">
                <span className="font-semibold text-slate-800">Assigned By:</span> {viewingTask.assignedBy?.name || "N/A"}
              </p>
              {viewingTask.lead && (
                <p className="text-slate-900">
                  <span className="font-semibold text-slate-800">Associated Lead:</span> {viewingTask.lead.name} (ID:{" "}
                  {viewingTask.lead.id})
                  {viewingTask.lead.company && ` - ${viewingTask.lead.company}`}
                </p>
              )}
            </div>
            <div className="p-6 bg-slate-50 border-t border-slate-200 flex justify-end rounded-b-3xl">
              <button
                onClick={() => setViewingTask(null)}
                className="group relative overflow-hidden bg-white text-slate-800 px-6 py-3 rounded-xl hover:bg-slate-50 transition-all duration-300 shadow-xl hover:shadow-slate-200/50 transform hover:scale-105 font-semibold border border-slate-200"
              >
                <span className="relative z-10">Close</span>
                <div className="absolute inset-0 bg-gradient-to-r from-indigo-400 to-purple-400 opacity-0 group-hover:opacity-20 transition-opacity duration-300"></div>
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
