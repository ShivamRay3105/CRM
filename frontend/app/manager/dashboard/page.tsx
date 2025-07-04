"use client"

import { useState, useEffect, useMemo, memo } from "react"
import { useRouter } from "next/navigation"
import dynamic from "next/dynamic"
import Navbar from "../../components/Navbar"

// Lazy load charts for better performance
const Bar = dynamic(() => import("react-chartjs-2").then((mod) => ({ default: mod.Bar })), {
  loading: () => <ChartSkeleton />,
  ssr: false,
})

const Pie = dynamic(() => import("react-chartjs-2").then((mod) => ({ default: mod.Pie })), {
  loading: () => <ChartSkeleton />,
  ssr: false,
})

const Doughnut = dynamic(() => import("react-chartjs-2").then((mod) => ({ default: mod.Doughnut })), {
  loading: () => <ChartSkeleton />,
  ssr: false,
})

// Chart.js registration
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, ArcElement, Title, Tooltip, Legend } from "chart.js"
ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, Title, Tooltip, Legend)

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
}

interface Task {
  id: number
  title: string
  description: string
  dueDate: string
  status: string
  priority: string
  createdAt: string
  updatedAt: string
  assignedTo: string
  assignedToId: number
  assignedBy: string
  assignedById: number
}

interface Employee {
  id: number
  name: string
  username: string
}

interface Analytics {
  totalLeads?: number
  totalTasks?: number
}

// Skeleton components for fast loading
const MetricSkeleton = memo(() => (
  <div className="bg-white/80 border border-white/20 rounded-xl shadow-lg p-6 animate-pulse">
    <div className="flex items-center justify-between">
      <div className="flex-1">
        <div className="h-4 bg-slate-200 rounded w-24 mb-2"></div>
        <div className="h-8 bg-slate-300 rounded w-16"></div>
      </div>
      <div className="w-12 h-12 bg-slate-200 rounded-lg"></div>
    </div>
  </div>
))

const ChartSkeleton = memo(() => (
  <div className="w-full h-64 bg-slate-100 rounded-lg animate-pulse flex items-center justify-center">
    <div className="text-slate-400">Loading chart...</div>
  </div>
))

// Chart options
const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  layout: {
    padding: 20,
  },
  plugins: {
    legend: { position: "top" as const },
    title: { display: false },
    tooltip: {
      enabled: true,
      backgroundColor: "rgba(0, 0, 0, 0.8)",
      titleColor: "#fff",
      bodyColor: "#fff",
      borderColor: "#6366f1",
      borderWidth: 1,
    },
  },
  scales: {
    x: {
      ticks: {
        padding: 10,
        color: "#475569",
      },
      offset: true,
      grid: { display: false },
    },
    y: {
      ticks: {
        padding: 10,
        color: "#475569",
      },
      grid: { color: "#E2E8F0" },
    },
  },
  interaction: {
    intersect: true,
    mode: "point" as const,
  },
  onHover: (event: any, elements: any) => {
    event.native.target.style.cursor = elements.length > 0 ? "pointer" : "default"
  },
}

const pieChartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  layout: {
    padding: 20,
  },
  plugins: {
    legend: { position: "top" as const },
    title: { display: false },
    tooltip: {
      enabled: true,
      backgroundColor: "rgba(0, 0, 0, 0.8)",
      titleColor: "#fff",
      bodyColor: "#fff",
      borderColor: "#10b981",
      borderWidth: 1,
    },
  },
  interaction: {
    intersect: true,
    mode: "point" as const,
  },
  elements: {
    arc: {
      hoverBorderWidth: 3,
      hoverBorderColor: "#ffffff",
    },
  },
  onHover: (event: any, elements: any) => {
    event.native.target.style.cursor = elements.length > 0 ? "pointer" : "default"
  },
}

export default function ManagerDashboard() {
  const router = useRouter()
  const [leads, setLeads] = useState<Lead[]>([])
  const [tasks, setTasks] = useState<Task[]>([])
  const [employees, setEmployees] = useState<Employee[]>([])
  const [myLeads, setMyLeads] = useState<Lead[]>([])
  const [myTasks, setMyTasks] = useState<Task[]>([])
  const [analytics, setAnalytics] = useState<Analytics>({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    const token = localStorage.getItem("token")
    console.log("Manager Dashboard: Token found:", token)
    if (!token) {
      console.log("Manager Dashboard: No token, redirecting to /login")
      router.push("/login")
      return
    }

    const fetchData = async () => {
      try {
        setLoading(true)
        setError("")

        // Check if backend is available first
        const healthCheck = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/users/me`, {
          credentials: "include",
        }).catch(() => null)

        if (!healthCheck || !healthCheck.ok) {
          throw new Error("Backend server is not available. Please ensure the server is running on localhost:8080")
        }

        // Fetch data with individual error handling
        const fetchWithFallback = async (url: string, fallback: any = []) => {
          try {
            const response = await fetch(url, { credentials: "include" })
            if (!response.ok) {
              console.warn(`Failed to fetch ${url}: ${response.status}`)
              return fallback
            }
            const data = await response.text()
            return data ? JSON.parse(data) : fallback
          } catch (err) {
            console.warn(`Error fetching ${url}:`, err)
            return fallback
          }
        }

        // Fetch leads of employees
        const leadsData = await fetchWithFallback(
          `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/Manager/allLeadsOfEmployees?page=0&size=100`,
          { content: [] },
        )
        setLeads(leadsData.content || [])

        // Fetch tasks of employees
        const tasksData = await fetchWithFallback(
          `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/Manager/allTasksOfEmployees?page=0&size=100`,
          { content: [] },
        )
        setTasks(tasksData.content || [])

        // Fetch employees
        const employeesData = await fetchWithFallback(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/Manager/employees`, [])
        setEmployees(employeesData || [])

        // Fetch my leads
      
        // Fetch my tasks
        const myTasksData = await fetchWithFallback(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/Tasks/myTasks?page=0&size=100`, {
          content: [],
        })
        setMyTasks(myTasksData.content || [])

        // Fetch analytics
        const analyticsData = await fetchWithFallback(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/analytics/manager`, {})
        setAnalytics(analyticsData || {})
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "Failed to load dashboard data"
        setError(errorMessage)
        console.error("Dashboard fetch error:", err)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [router])

  // Memoized calculations for better performance
  const metrics = useMemo(() => {
    const leadStatuses = ["NEW", "CONTACTED", "QUALIFIED", "LOST", "CONVERTED"]
    const leadStatusCounts = leadStatuses.reduce(
      (acc, status) => {
        acc[status] = leads.filter((lead) => lead.status?.toUpperCase() === status).length
        return acc
      },
      {} as Record<string, number>,
    )

    const myLeadStatusCounts = leadStatuses.reduce(
      (acc, status) => {
        acc[status] = myLeads.filter((lead) => lead.status?.toUpperCase() === status).length
        return acc
      },
      {} as Record<string, number>,
    )

    const taskStatuses = ["TODO", "IN_PROGRESS", "DONE"]
    const taskStatusCounts = taskStatuses.reduce(
      (acc, status) => {
        acc[status] = tasks.filter((task) => task.status?.toUpperCase() === status).length
        return acc
      },
      {} as Record<string, number>,
    )

    const myTaskStatusCounts = taskStatuses.reduce(
      (acc, status) => {
        acc[status] = myTasks.filter((task) => task.status?.toUpperCase() === status).length
        return acc
      },
      {} as Record<string, number>,
    )

    const taskPriorities = ["LOW", "MEDIUM", "HIGH", "URGENT"]
    const taskPriorityCounts = taskPriorities.reduce(
      (acc, priority) => {
        acc[priority] = tasks.filter((task) => task.priority?.toUpperCase() === priority).length
        return acc
      },
      {} as Record<string, number>,
    )

    const today = new Date().toISOString().split("T")[0]
    const thisWeek = new Date()
    thisWeek.setDate(thisWeek.getDate() - 7)

    const upcomingTasks = tasks.filter((task) => {
      const dueDate = new Date(task.dueDate)
      const diffDays = (dueDate.getTime() - new Date().getTime()) / (1000 * 3600 * 24)
      return diffDays >= 0 && diffDays <= 7
    })

    const overdueTasks = tasks.filter((task) => new Date(task.dueDate) < new Date())
    const dueTodayTasks = tasks.filter((task) => task.dueDate?.split("T")[0] === today)

    const teamQualifiedLeadsRate = leads.length ? ((leadStatusCounts["QUALIFIED"] || 0) / leads.length) * 100 : 0
    const teamTaskCompletionRate = tasks.length ? ((taskStatusCounts["DONE"] || 0) / tasks.length) * 100 : 0
    const myTaskCompletionRate = myTasks.length ? ((myTaskStatusCounts["DONE"] || 0) / myTasks.length) * 100 : 0

    // Calculate team performance score
    const teamPerformanceScore = Math.min(100, Math.floor((teamTaskCompletionRate + teamQualifiedLeadsRate) / 2))

    // Calculate average team response time (mock calculation)
    const avgTeamResponseTime = leads.length ? Math.floor(Math.random() * 24) + 1 : 0

    // Calculate workload distribution
    const avgTasksPerEmployee = employees.length ? Math.floor(tasks.length / employees.length) : 0

    return {
      totalTeamLeads: leads.length,
      totalTeamTasks: tasks.length,
      totalMyLeads: myLeads.length,
      totalMyTasks: myTasks.length,
      totalEmployees: employees.length,
      teamQualifiedLeadsRate,
      teamTaskCompletionRate,
      myTaskCompletionRate,
      upcomingTasks: upcomingTasks.length,
      overdueTasks: overdueTasks.length,
      dueTodayTasks: dueTodayTasks.length,
      teamPerformanceScore,
      avgTeamResponseTime,
      avgTasksPerEmployee,
      leadStatusCounts,
      taskStatusCounts,
      taskPriorityCounts,
      upcomingTasksList: upcomingTasks.slice(0, 5),
      overdueTasksList: overdueTasks.slice(0, 5),
    }
  }, [leads, tasks, employees, myLeads, myTasks])

  // Memoized chart data
  const chartData = useMemo(() => {
    const leadStatuses = ["NEW", "CONTACTED", "QUALIFIED", "LOST"]
    const taskStatuses = ["TODO", "IN_PROGRESS", "DONE"]
    const taskPriorities = ["LOW", "MEDIUM", "HIGH", "URGENT"]

    return {
      leadStatusChart: {
        labels: leadStatuses,
        datasets: [
          {
            label: "Team Leads by Status",
            data: leadStatuses.map((status) => metrics.leadStatusCounts[status] || 0),
            backgroundColor: ["#3b82f6", "#ec4899", "#eab308", "#ef4444", "#8b5cf6"],
            hoverBackgroundColor: ["#2563eb", "#db2777", "#ca8a04", "#dc2626", "#7c3aed"],
            borderWidth: 0,
            borderRadius: 4,
          },
        ],
      },
      taskStatusChart: {
        labels: taskStatuses,
        datasets: [
          {
            label: "Team Tasks by Status",
            data: taskStatuses.map((status) => metrics.taskStatusCounts[status] || 0),
            backgroundColor: ["#3b82f6", "#f59e0b", "#22c55e"],
            hoverBackgroundColor: ["#2563eb", "#d97706", "#16a34a"],
            borderWidth: 0,
          },
        ],
      },
      taskPriorityChart: {
        labels: taskPriorities,
        datasets: [
          {
            label: "Team Tasks by Priority",
            data: taskPriorities.map((priority) => metrics.taskPriorityCounts[priority] || 0),
            backgroundColor: ["#22c55e", "#06b6d4", "#8b5cf6", "#ef4444"],
            hoverBackgroundColor: ["#16a34a", "#0891b2", "#7c3aed", "#dc2626"],
            borderWidth: 0,
            borderRadius: 4,
          },
        ],
      },
    }
  }, [metrics])

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
        <Navbar role="manager" />
        <div className="container mx-auto px-6 pt-8">
          <div className="mb-8">
            <div className="h-8 bg-slate-200 rounded w-64 mb-2 animate-pulse"></div>
            <div className="h-4 bg-slate-100 rounded w-96 animate-pulse"></div>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-8">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((i) => (
              <MetricSkeleton key={i} />
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      <Navbar role="manager" />

      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-indigo-600/10 to-purple-600/10"></div>
        <div className="relative container mx-auto px-6 pt-12 pb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-indigo-800 via-purple-700 to-blue-800 bg-clip-text text-transparent mb-4">
                Manager Dashboard
              </h1>
              <p className="text-lg text-slate-600 font-medium">
                Team management and personal performance overview
              </p>
            </div>
            <div className="hidden md:block">
              <div className="w-24 h-24 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-xl">
                <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                  />
                </svg>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Container */}
      <div className="container mx-auto px-6 pb-8">
        {error && (
          <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-400 rounded-lg shadow-sm">
            <div className="flex items-start">
              <svg
                className="w-5 h-5 text-red-400 mt-0.5 mr-3 flex-shrink-0"
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
              <div>
                <h3 className="text-sm font-medium text-red-800 mb-1">Dashboard Loading Error</h3>
                <p className="text-sm text-red-700">{error}</p>
                <div className="mt-3">
                  <button
                    onClick={() => window.location.reload()}
                    className="text-sm bg-red-100 hover:bg-red-200 text-red-800 px-3 py-1 rounded-md transition-colors duration-200"
                  >
                    Retry Loading
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Enhanced Metric Cards - 2 per row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <div className="group bg-white/90 border border-white/40 rounded-xl shadow-lg hover:shadow-2xl hover:shadow-blue-500/20 transition-all duration-300 transform hover:scale-105 hover:-translate-y-2 p-8 cursor-pointer relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-indigo-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            <div className="relative z-10 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-slate-600 uppercase tracking-wider group-hover:text-blue-700 transition-colors duration-300">
                  Team Leads
                </h3>
                <p className="text-3xl font-bold text-blue-600 group-hover:text-blue-700 transition-colors duration-300">
                  {metrics.totalTeamLeads}
                </p>
                <div className="mt-2 text-xs text-slate-500 group-hover:text-blue-600 transition-colors duration-300">
                  All team prospects
                </div>
              </div>
              <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center group-hover:scale-110 group-hover:rotate-3 transition-all duration-300 shadow-lg group-hover:shadow-blue-500/50">
                <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                  />
                </svg>
              </div>
            </div>
            <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 to-indigo-600 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left"></div>
          </div>

          <div className="group bg-white/90 border border-white/40 rounded-xl shadow-lg hover:shadow-2xl hover:shadow-emerald-500/20 transition-all duration-300 transform hover:scale-105 hover:-translate-y-2 p-8 cursor-pointer relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-teal-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            <div className="relative z-10 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-slate-600 uppercase tracking-wider group-hover:text-emerald-700 transition-colors duration-300">
                  Team Tasks
                </h3>
                <p className="text-3xl font-bold text-emerald-600 group-hover:text-emerald-700 transition-colors duration-300">
                  {metrics.totalTeamTasks}
                </p>
                <div className="mt-2 text-xs text-slate-500 group-hover:text-emerald-600 transition-colors duration-300">
                  All team work items
                </div>
              </div>
              <div className="w-14 h-14 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center group-hover:scale-110 group-hover:rotate-3 transition-all duration-300 shadow-lg group-hover:shadow-emerald-500/50">
                <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"
                  />
                </svg>
              </div>
            </div>
            <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-500 to-teal-600 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left"></div>
          </div>

        

          <div className="group bg-white/90 border border-white/40 rounded-xl shadow-lg hover:shadow-2xl hover:shadow-green-500/20 transition-all duration-300 transform hover:scale-105 hover:-translate-y-2 p-8 cursor-pointer relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-green-500/5 to-emerald-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            <div className="relative z-10 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-slate-600 uppercase tracking-wider group-hover:text-green-700 transition-colors duration-300">
                  My Tasks
                </h3>
                <p className="text-3xl font-bold text-green-600 group-hover:text-green-700 transition-colors duration-300">
                  {metrics.totalMyTasks}
                </p>
                <div className="mt-2 text-xs text-slate-500 group-hover:text-green-600 transition-colors duration-300">
                  Personal work items
                </div>
              </div>
              <div className="w-14 h-14 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center group-hover:scale-110 group-hover:rotate-3 transition-all duration-300 shadow-lg group-hover:shadow-green-500/50">
                <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
            </div>
            <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-green-500 to-emerald-600 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left"></div>
          </div>

          <div className="group bg-white/90 border border-white/40 rounded-xl shadow-lg hover:shadow-2xl hover:shadow-teal-500/20 transition-all duration-300 transform hover:scale-105 hover:-translate-y-2 p-8 cursor-pointer relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-teal-500/5 to-cyan-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            <div className="relative z-10 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-slate-600 uppercase tracking-wider group-hover:text-teal-700 transition-colors duration-300">
                  Team Members
                </h3>
                <p className="text-3xl font-bold text-teal-600 group-hover:text-teal-700 transition-colors duration-300">
                  {metrics.totalEmployees}
                </p>
                <div className="mt-2 text-xs text-slate-500 group-hover:text-teal-600 transition-colors duration-300">
                  Direct reports
                </div>
              </div>
              <div className="w-14 h-14 bg-gradient-to-br from-teal-500 to-cyan-600 rounded-xl flex items-center justify-center group-hover:scale-110 group-hover:rotate-3 transition-all duration-300 shadow-lg group-hover:shadow-teal-500/50">
                <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z"
                  />
                </svg>
              </div>
            </div>
            <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-teal-500 to-cyan-600 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left"></div>
          </div>

          <div className="group bg-white/90 border border-white/40 rounded-xl shadow-lg hover:shadow-2xl hover:shadow-orange-500/20 transition-all duration-300 transform hover:scale-105 hover:-translate-y-2 p-8 cursor-pointer relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-orange-500/5 to-amber-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            <div className="relative z-10 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-slate-600 uppercase tracking-wider group-hover:text-orange-700 transition-colors duration-300">
                  Team Qualified Leads 
                </h3>
                <p className="text-3xl font-bold text-orange-600 group-hover:text-orange-700 transition-colors duration-300">
                  {metrics.teamQualifiedLeadsRate.toFixed(1)}%
                </p>
                <div className="mt-2 text-xs text-slate-500 group-hover:text-orange-600 transition-colors duration-300">
                  Team success rate
                </div>
              </div>
              <div className="w-14 h-14 bg-gradient-to-br from-orange-500 to-amber-600 rounded-xl flex items-center justify-center group-hover:scale-110 group-hover:rotate-3 transition-all duration-300 shadow-lg group-hover:shadow-orange-500/50">
                <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
                  />
                </svg>
              </div>
            </div>
            <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-orange-500 to-amber-600 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left"></div>
          </div>

          <div className="group bg-white/90 border border-white/40 rounded-xl shadow-lg hover:shadow-2xl hover:shadow-amber-500/20 transition-all duration-300 transform hover:scale-105 hover:-translate-y-2 p-8 cursor-pointer relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-amber-500/5 to-yellow-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            <div className="relative z-10 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-slate-600 uppercase tracking-wider group-hover:text-amber-700 transition-colors duration-300">
                  Team Performance
                </h3>
                <p className="text-3xl font-bold text-amber-600 group-hover:text-amber-700 transition-colors duration-300">
                  {metrics.teamPerformanceScore}
                </p>
                <div className="mt-2 text-xs text-slate-500 group-hover:text-amber-600 transition-colors duration-300">
                  Overall team score
                </div>
              </div>
              <div className="w-14 h-14 bg-gradient-to-br from-amber-500 to-yellow-600 rounded-xl flex items-center justify-center group-hover:scale-110 group-hover:rotate-3 transition-all duration-300 shadow-lg group-hover:shadow-amber-500/50">
                <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"
                  />
                </svg>
              </div>
            </div>
            <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-amber-500 to-yellow-600 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left"></div>
          </div>

          <div className="group bg-white/90 border border-white/40 rounded-xl shadow-lg hover:shadow-2xl hover:shadow-red-500/20 transition-all duration-300 transform hover:scale-105 hover:-translate-y-2 p-8 cursor-pointer relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-red-500/5 to-rose-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            <div className="relative z-10 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-slate-600 uppercase tracking-wider group-hover:text-red-700 transition-colors duration-300">
                  Overdue Tasks
                </h3>
                <p className="text-3xl font-bold text-red-600 group-hover:text-red-700 transition-colors duration-300">
                  {metrics.overdueTasks}
                </p>
                <div className="mt-2 text-xs text-slate-500 group-hover:text-red-600 transition-colors duration-300">
                  Team attention needed
                </div>
              </div>
              <div className="w-14 h-14 bg-gradient-to-br from-red-500 to-rose-600 rounded-xl flex items-center justify-center group-hover:scale-110 group-hover:rotate-3 transition-all duration-300 shadow-lg group-hover:shadow-red-500/50">
                <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                  />
                </svg>
              </div>
            </div>
            <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-red-500 to-rose-600 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left"></div>
          </div>
        </div>

        {/* Charts Layout - 2 per row */}
        <div className="space-y-6">
          {/* First Row - Two Bar Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Team Leads by Status Bar Chart */}
            <div className="group bg-white/90 border border-white/40 rounded-xl shadow-lg hover:shadow-2xl hover:shadow-blue-500/20 transition-all duration-300 transform hover:scale-[1.02] hover:-translate-y-1 p-6 cursor-pointer relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-indigo-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <div className="relative z-10">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center group-hover:scale-110 group-hover:rotate-6 transition-all duration-300 shadow-lg group-hover:shadow-blue-500/50">
                    <svg
                      className="w-5 h-5 text-white group-hover:scale-110 transition-transform duration-300"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                      />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-slate-800 group-hover:text-blue-700 transition-colors duration-300">
                      Team Leads by Status
                    </h3>
                    <p className="text-sm text-slate-500 group-hover:text-blue-600 transition-colors duration-300">
                      Team pipeline distribution
                    </p>
                  </div>
                </div>
                <div className="h-80 group-hover:scale-[1.01] transition-transform duration-300">
                  <Bar data={chartData.leadStatusChart} options={chartOptions} />
                </div>
              </div>
              <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 to-indigo-600 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left"></div>
            </div>

            {/* Team Tasks by Priority Bar Chart */}
            <div className="group bg-white/90 border border-white/40 rounded-xl shadow-lg hover:shadow-2xl hover:shadow-cyan-500/20 transition-all duration-300 transform hover:scale-[1.02] hover:-translate-y-1 p-6 cursor-pointer relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 to-teal-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <div className="relative z-10">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-gradient-to-br from-cyan-500 to-teal-600 rounded-xl flex items-center justify-center group-hover:scale-110 group-hover:rotate-6 transition-all duration-300 shadow-lg group-hover:shadow-cyan-500/50">
                    <svg
                      className="w-5 h-5 text-white group-hover:scale-110 transition-transform duration-300"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                      />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-slate-800 group-hover:text-cyan-700 transition-colors duration-300">
                      Team Tasks by Priority
                    </h3>
                    <p className="text-sm text-slate-500 group-hover:text-cyan-600 transition-colors duration-300">
                      Team priority distribution
                    </p>
                  </div>
                </div>
                <div className="h-80 group-hover:scale-[1.01] transition-transform duration-300">
                  <Bar data={chartData.taskPriorityChart} options={chartOptions} />
                </div>
              </div>
              <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-cyan-500 to-teal-600 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left"></div>
            </div>
          </div>

          {/* Second Row - One Pie Chart (Full Width) */}
          <div className="grid grid-cols-1 gap-6">
            {/* Team Tasks by Status Pie Chart */}
            <div className="group bg-white/90 border border-white/40 rounded-xl shadow-lg hover:shadow-2xl hover:shadow-emerald-500/20 transition-all duration-300 transform hover:scale-[1.02] hover:-translate-y-1 p-6 cursor-pointer relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-teal-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <div className="relative z-10">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center group-hover:scale-110 group-hover:rotate-6 transition-all duration-300 shadow-lg group-hover:shadow-emerald-500/50">
                    <svg
                      className="w-5 h-5 text-white group-hover:scale-110 transition-transform duration-300"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"
                      />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-slate-800 group-hover:text-emerald-700 transition-colors duration-300">
                      Team Tasks by Status
                    </h3>
                    <p className="text-sm text-slate-500 group-hover:text-emerald-600 transition-colors duration-300">
                      Team work progress overview
                    </p>
                  </div>
                </div>
                <div className="h-96 group-hover:scale-[1.01] transition-transform duration-300 flex items-center justify-center">
                  <div className="w-[60%] h-full flex items-center justify-center">
                    <Pie data={chartData.taskStatusChart} options={pieChartOptions} />
                  </div>
                </div>
              </div>
              <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-500 to-teal-600 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left"></div>
            </div>
          </div>

          {/* Third Row - Task Lists */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Upcoming Tasks List */}
            <div className="group bg-white/90 border border-white/40 rounded-xl shadow-lg hover:shadow-2xl hover:shadow-violet-500/20 transition-all duration-300 transform hover:scale-[1.02] hover:-translate-y-1 p-6 cursor-pointer relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-violet-500/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <div className="relative z-10">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-gradient-to-br from-violet-500 to-purple-600 rounded-xl flex items-center justify-center group-hover:scale-110 group-hover:rotate-6 transition-all duration-300 shadow-lg group-hover:shadow-violet-500/50">
                    <svg
                      className="w-5 h-5 text-white group-hover:scale-110 transition-transform duration-300"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                  </div>
                  <div className="flex justify-between items-center w-full">
                    <div>
                      <h3 className="text-base font-semibold text-slate-800 group-hover:text-violet-700 transition-colors duration-300">
                        Upcoming Team Tasks
                      </h3>
                      <p className="text-xs text-slate-500 group-hover:text-violet-600 transition-colors duration-300">
                        Next 7 days schedule
                      </p>
                    </div>
                    <span className="text-base font-semibold text-slate-800 group-hover:text-violet-700 transition-colors duration-300 mr-[20px]">
                      Priority
                    </span>
                  </div>
                </div>

                {metrics.upcomingTasksList.length > 0 ? (
                  <div className="space-y-3 max-h-64 overflow-y-auto">
                    {metrics.upcomingTasksList.map((task, index) => (
                      <div
                        key={task.id}
                        className="p-3 bg-violet-50 rounded-lg border border-violet-100 hover:bg-violet-100 hover:border-violet-200 hover:shadow-md transition-all duration-200 transform hover:scale-[1.02] hover:-translate-y-0.5 cursor-pointer relative overflow-hidden"
                        style={{
                          animationDelay: `${index * 100}ms`,
                          animation: "slideInUp 0.6s ease-out both",
                        }}
                      >
                        <div className="absolute inset-0 bg-gradient-to-r from-violet-500/5 to-purple-500/5 opacity-0 hover:opacity-100 transition-opacity duration-200"></div>
                        <div className="relative z-10 flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-gradient-to-br from-violet-500 to-purple-600 rounded-full flex items-center justify-center text-white text-sm font-semibold">
                              {task.title.charAt(0).toUpperCase()}
                            </div>
                            <div className="flex-1">
                              <span className="text-slate-900">{task.title}</span>
                              <p className="text-xs text-slate-600">
                                Due: {new Date(task.dueDate).toLocaleDateString()} | Assigned to: {task.assignedTo}
                              </p>
                            </div>
                          </div>
                          <span
                            className={`px-2 py-1 rounded-full text-xs font-semibold transition-all duration-200 hover:scale-105 ${
                              task.priority === "HIGH" || task.priority === "URGENT"
                                ? "bg-red-100 text-red-800 hover:bg-red-200"
                                : task.priority === "MEDIUM"
                                  ? "bg-amber-100 text-amber-800 hover:bg-amber-200"
                                  : "bg-green-100 text-green-800 hover:bg-green-200"
                            }`}
                          >
                            {task.priority}
                          </span>
                        </div>
                        <div className="absolute bottom-0 left-0 w-full h-0.5 bg-gradient-to-r from-violet-500 to-purple-500 transform scale-x-0 hover:scale-x-100 transition-transform duration-200 origin-left"></div>
                      </div>
                    ))}
                  </div>
               ) : (
                  <div className="text-center py-8">
                    <div className="w-16 h-16 bg-violet-100 rounded-full flex items-center justify-center mx-auto mb-3 group-hover:bg-violet-200 group-hover:scale-110 transition-all duration-300">
                      <svg
                        className="w-8 h-8 text-violet-400 group-hover:text-violet-600 transition-colors duration-300"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                    </div>
                    <p className="text-slate-500 group-hover:text-violet-600 transition-colors duration-300">
                      No upcoming team tasks
                    </p>
                  </div>
                )}
              </div>
              <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-violet-500 to-purple-600 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left"></div>
            </div>

            {/* Overdue Tasks List */}
            <div className="group bg-white/90 border border-white/40 rounded-xl shadow-lg hover:shadow-2xl hover:shadow-red-500/20 transition-all duration-300 transform hover:scale-[1.02] hover:-translate-y-1 p-6 cursor-pointer relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-red-500/5 to-rose-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <div className="relative z-10">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-gradient-to-br from-red-500 to-rose-600 rounded-xl flex items-center justify-center group-hover:scale-110 group-hover:rotate-6 transition-all duration-300 shadow-lg group-hover:shadow-red-500/50">
                    <svg
                      className="w-5 h-5 text-white group-hover:scale-110 transition-transform duration-300"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                      />
                    </svg>
                  </div>
                  <div className="flex justify-between items-center w-full">
                    <div>
                      <h3 className="text-base font-semibold text-slate-800 group-hover:text-red-700 transition-colors duration-300">
                        Overdue Team Tasks
                      </h3>
                      <p className="text-xs text-slate-500 group-hover:text-red-600 transition-colors duration-300">
                        Requires immediate attention
                      </p>
                    </div>
                    <span className="text-base font-semibold text-slate-800 group-hover:text-red-700 transition-colors duration-300 mr-[20px]">
                      Priority
                    </span>
                  </div>
                </div>

                {metrics.overdueTasksList.length > 0 ? (
                  <div className="space-y-3 max-h-64 overflow-y-auto">
                    {metrics.overdueTasksList.map((task, index) => (
                      <div
                        key={task.id}
                        className="p-3 bg-red-50 rounded-lg border border-red-100 hover:bg-red-100 hover:border-red-200 hover:shadow-md transition-all duration-200 transform hover:scale-[1.02] hover:-translate-y-0.5 cursor-pointer relative overflow-hidden"
                        style={{
                          animationDelay: `${index * 100}ms`,
                          animation: "slideInUp 0.6s ease-out both",
                        }}
                      >
                        <div className="absolute inset-0 bg-gradient-to-r from-red-500/5 to-rose-500/5 opacity-0 hover:opacity-100 transition-opacity duration-200"></div>
                        <div className="relative z-10 flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-gradient-to-br from-red-500 to-rose-600 rounded-full flex items-center justify-center text-white text-sm font-semibold">
                              {task.title.charAt(0).toUpperCase()}
                            </div>
                            <div className="flex-1">
                              <span className="text-slate-900">{task.title}</span>
                              <p className="text-xs text-slate-600">
                                Overdue: {new Date(task.dueDate).toLocaleDateString()} | Assigned to: {task.assignedTo}
                              </p>
                            </div>
                          </div>
                          <span className="px-2 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-800 hover:bg-red-200 hover:scale-105 transition-all duration-200">
                            {task.priority}
                          </span>
                        </div>
                        <div className="absolute bottom-0 left-0 w-full h-0.5 bg-gradient-to-r from-red-500 to-rose-500 transform scale-x-0 hover:scale-x-100 transition-transform duration-200 origin-left"></div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3 group-hover:bg-green-200 group-hover:scale-110 transition-all duration-300">
                      <svg
                        className="w-8 h-8 text-green-500 group-hover:text-green-600 transition-colors duration-300"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                    </div>
                    <p className="text-slate-500 group-hover:text-green-600 transition-colors duration-300">
                      No overdue team tasks
                    </p>
                    <p className="text-xs text-slate-400 group-hover:text-green-500 transition-colors duration-300 mt-1">
                      Great team management!
                    </p>
                  </div>
                )}
              </div>
              <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-red-500 to-rose-600 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left"></div>
            </div>
          </div>
        </div>

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
        `}</style>
      </div>
    </div>
  )
}