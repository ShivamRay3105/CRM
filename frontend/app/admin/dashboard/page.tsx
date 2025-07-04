
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

interface Client {
  id: number
  name: string
  email: string
  phone: string
  company: string
  address: string
  status: string
  assignedTo: { name: string; id: number }
}

interface User {
  id: number
  name: string
  username: string
}

interface DashboardData {
  leads: Lead[]
  tasks: Task[]
  clients: Client[]
  users: User[]
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

export default function AdminDashboard() {
  const router = useRouter()
  const [data, setData] = useState<DashboardData>({ leads: [], tasks: [], clients: [], users: [] })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    const token = localStorage.getItem("token")
    if (!token) {
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

        // Fetch all data
        const [leadsData, tasksData, clientsData, usersData] = await Promise.all([
          fetchWithFallback(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/admin/allLeads?page=0&size=100`, { content: [] }),
          fetchWithFallback(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/admin/allTasks?page=0&size=100`, { content: [] }),
          fetchWithFallback(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/admin/getAllClients`, []),
          fetchWithFallback(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/admin/getAllUsers`, []),
        ])

        setData({
          leads: leadsData.content || [],
          tasks: tasksData.content || [],
          clients: clientsData || [],
          users: usersData || [],
        })
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "Failed to load dashboard data"
        setError(errorMessage)
        console.error("Dashboard fetch error:", err)
        setData({ leads: [], tasks: [], clients: [], users: [] })
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [router])

  // Memoized calculations for better performance
  const metrics = useMemo(() => {
    const { leads, tasks, clients, users } = data

    const leadStatusCounts = leads.reduce(
      (acc, lead) => {
        const status = lead.status?.toUpperCase() || "UNKNOWN"
        acc[status] = (acc[status] || 0) + 1
        return acc
      },
      {} as Record<string, number>,
    )

    const taskStatusCounts = tasks.reduce(
      (acc, task) => {
        const status = task.status?.toUpperCase() || "UNKNOWN"
        acc[status] = (acc[status] || 0) + 1
        return acc
      },
      {} as Record<string, number>,
    )

    const clientStatusCounts = clients.reduce(
      (acc, client) => {
        const status = client.status?.toUpperCase() || "UNKNOWN"
        acc[status] = (acc[status] || 0) + 1
        return acc
      },
      {} as Record<string, number>,
    )

    const taskPriorityCounts = tasks.reduce(
      (acc, task) => {
        const priority = task.priority?.toUpperCase() || "UNKNOWN"
        acc[priority] = (acc[priority] || 0) + 1
        return acc
      },
      {} as Record<string, number>,
    )

    const leadsByEmployee = users.length
      ? users.reduce(
          (acc, user) => {
            acc[user.username] = leads.filter((lead) => lead.assignedToId === user.id).length
            return acc
          },
          {} as Record<string, number>,
        )
      : {}

    const today = new Date().toISOString().split("T")[0]

    const upcomingTasks = tasks.filter((task) => {
      const dueDate = new Date(task.dueDate)
      const diffDays = (dueDate.getTime() - new Date().getTime()) / (1000 * 3600 * 24)
      return diffDays >= 0 && diffDays <= 7
    })

    const overdueTasks = tasks.filter((task) => new Date(task.dueDate) < new Date())

    const dueTodayTasks = tasks.filter((task) => task.dueDate?.split("T")[0] === today)

   const total = leads.length + clients.length;

const conversionRate = total
  ? (
      (clientStatusCounts["ACTIVE"] ?? 0) +
      (clientStatusCounts["INACTIVE"] ?? 0) +
      (clientStatusCounts["CLOSED"] ?? 0) +
      (clientStatusCounts["ON_HOLD"] ?? 0)
    ) / total * 100
  : 0;
    const taskCompletionRate = tasks.length ? ((taskStatusCounts["DONE"] || 0) / tasks.length) * 100 : 0

    return {
      totalLeads: leads.length,
      totalTasks: tasks.length,
      totalClients: clients.length,
      totalUsers: users.length,
      conversionRate,
      taskCompletionRate,
      upcomingTasks: upcomingTasks.length,
      overdueTasks: overdueTasks.length,
      dueTodayTasks: dueTodayTasks.length,
      leadStatusCounts,
      taskStatusCounts,
      clientStatusCounts,
      taskPriorityCounts,
      leadsByEmployee,
      upcomingTasksList: upcomingTasks.slice(0, 5),
      overdueTasksList: overdueTasks.slice(0, 5),
    }
  }, [data])

  // Memoized chart data
  const chartData = useMemo(() => {
    const leadStatuses = ["NEW", "CONTACTED", "QUALIFIED", "LOST", "CONVERTED"]
    const taskStatuses = ["TODO", "IN_PROGRESS", "DONE"]
    const clientStatuses = ["ACTIVE", "INACTIVE", "ON_HOLD", "CLOSED"]
    const taskPriorities = ["LOW", "MEDIUM", "HIGH", "URGENT"]

    // Generate colors for individual leads
    const generateColors = (count: number) => {
      const colors = []
      const hueStep = 360 / count
      for (let i = 0; i < count; i++) {
        const hue = i * hueStep
        colors.push(`hsl(${hue}, 70%, 60%)`)
      }
      return colors
    }

    // Individual leads data - each lead as separate slice
    const individualLeadsData = data.leads.map((lead, index) => ({
      label: `${lead.name} (${lead.company})`,
      value: 1,
      backgroundColor: generateColors(data.leads.length)[index],
    }))

    return {
      leadStatusChart: {
        labels: leadStatuses,
        datasets: [
          {
            label: "Leads",
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
            label: "Tasks",
            data: taskStatuses.map((status) => metrics.taskStatusCounts[status] || 0),
            backgroundColor: ["#3b82f6", "#f59e0b", "#22c55e"],
            hoverBackgroundColor: ["#2563eb", "#d97706", "#16a34a"],
            borderWidth: 0,
          },
        ],
      },
      clientStatusChart: {
        labels: clientStatuses,
        datasets: [
          {
            label: "Clients",
            data: clientStatuses.map((status) => metrics.clientStatusCounts[status] || 0),
            backgroundColor: ["#22c55e", "#6b7280", "#f59e0b", "#ef4444"],
            hoverBackgroundColor: ["#16a34a", "#4b5563", "#d97706", "#dc2626"],
            borderWidth: 0,
          },
        ],
      },
      taskPriorityChart: {
        labels: taskPriorities,
        datasets: [
          {
            label: "Tasks by Priority",
            data: taskPriorities.map((priority) => metrics.taskPriorityCounts[priority] || 0),
            backgroundColor: ["#22c55e", "#06b6d4", "#8b5cf6", "#ef4444"],
            hoverBackgroundColor: ["#16a34a", "#0891b2", "#7c3aed", "#dc2626"],
            borderWidth: 0,
            borderRadius: 4,
          },
        ],
      },
      // Individual leads chart - each lead as separate slice
      individualLeadsChart: {
        labels: individualLeadsData.map((lead) => lead.label),
        datasets: [
          {
            label: "Individual Leads",
            data: individualLeadsData.map((lead) => lead.value),
            backgroundColor: individualLeadsData.map((lead) => lead.backgroundColor),
            hoverBackgroundColor: individualLeadsData.map((lead) => lead.backgroundColor),
            borderWidth: 1,
            borderColor: "#ffffff",
          },
        ],
      },
      // Leads by employee list data
      leadsByEmployeeList: data.users
        .map((user) => {
          const userLeads = data.leads.filter((lead) => lead.assignedToId === user.id)
          return {
            username: user.username,
            userId: user.id,
            leads: userLeads,
            leadCount: userLeads.length,
          }
        })
        .filter((user) => user.leadCount > 0),
    }
  }, [metrics, data.leads, data.users])

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
        <Navbar role="admin" />
        <div className="container mx-auto px-6 pt-8">
          <div className="mb-8">
            <div className="h-8 bg-slate-200 rounded w-64 mb-2 animate-pulse"></div>
            <div className="h-4 bg-slate-100 rounded w-96 animate-pulse"></div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
              <MetricSkeleton key={i} />
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      <Navbar role="admin" />

      {/* Updated Hero Section */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-indigo-600/10 to-purple-600/10"></div>
        <div className="relative container mx-auto px-6 pt-12 pb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-indigo-800 via-purple-700 to-blue-800 bg-clip-text text-transparent mb-4">
                Admin Dashboard
              </h1>
              <p className="text-lg text-slate-600 font-medium">
                Business overview and key metrics
              </p>
            </div>
            <div className="hidden md:block">
              <div className="w-24 h-24 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-xl">
                <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
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

        {/* Enhanced Metric Cards with Hover Effects */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="group bg-white/90 border border-white/40 rounded-xl shadow-lg hover:shadow-2xl hover:shadow-indigo-500/20 transition-all duration-300 transform hover:scale-105 hover:-translate-y-2 p-8 cursor-pointer relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            <div className="relative z-10 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-slate-600 uppercase tracking-wider group-hover:text-indigo-700 transition-colors duration-300">
                  Total Leads
                </h3>
                <p className="text-3xl font-bold text-indigo-600 group-hover:text-indigo-700 transition-colors duration-300">
                  {metrics.totalLeads}
                </p>
                <div className="mt-2 text-xs text-slate-500 group-hover:text-indigo-600 transition-colors duration-300">
                  Active prospects
                </div>
              </div>
              <div className="w-14 h-14 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center group-hover:scale-110 group-hover:rotate-3 transition-all duration-300 shadow-lg group-hover:shadow-indigo-500/50">
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
            <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 to-purple-600 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left"></div>
          </div>

          <div className="group bg-white/90 border border-white/40 rounded-xl shadow-lg hover:shadow-2xl hover:shadow-emerald-500/20 transition-all duration-300 transform hover:scale-105 hover:-translate-y-2 p-8 cursor-pointer relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-teal-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            <div className="relative z-10 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-slate-600 uppercase tracking-wider group-hover:text-emerald-700 transition-colors duration-300">
                  Total Tasks
                </h3>
                <p className="text-3xl font-bold text-emerald-600 group-hover:text-emerald-700 transition-colors duration-300">
                  {metrics.totalTasks}
                </p>
                <div className="mt-2 text-xs text-slate-500 group-hover:text-emerald-600 transition-colors duration-300">
                  Work items
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

          <div className="group bg-white/90 border border-white/40 rounded-xl shadow-lg hover:shadow-2xl hover:shadow-blue-500/20 transition-all duration-300 transform hover:scale-105 hover:-translate-y-2 p-8 cursor-pointer relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-cyan-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            <div className="relative z-10 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-slate-600 uppercase tracking-wider group-hover:text-blue-700 transition-colors duration-300">
                  Total Clients
                </h3>
                <p className="text-3xl font-bold text-blue-600 group-hover:text-blue-700 transition-colors duration-300">
                  {metrics.totalClients}
                </p>
                <div className="mt-2 text-xs text-slate-500 group-hover:text-blue-600 transition-colors duration-300">
                  Active accounts
                </div>
              </div>
              <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-xl flex items-center justify-center group-hover:scale-110 group-hover:rotate-3 transition-all duration-300 shadow-lg group-hover:shadow-blue-500/50">
                <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                  />
                </svg>
              </div>
            </div>
            <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 to-cyan-600 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left"></div>
          </div>

          <div className="group bg-white/90 border border-white/40 rounded-xl shadow-lg hover:shadow-2xl hover:shadow-purple-500/20 transition-all duration-300 transform hover:scale-105 hover:-translate-y-2 p-8 cursor-pointer relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-pink-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            <div className="relative z-10 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-slate-600 uppercase tracking-wider group-hover:text-purple-700 transition-colors duration-300">
                  Conversion Rate
                </h3>
                <p className="text-3xl font-bold text-purple-600 group-hover:text-purple-700 transition-colors duration-300">
                  {metrics.conversionRate.toFixed(1)}%
                </p>
                <div className="mt-2 text-xs text-slate-500 group-hover:text-purple-600 transition-colors duration-300">
                  Success ratio
                </div>
              </div>
              <div className="w-14 h-14 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl flex items-center justify-center group-hover:scale-110 group-hover:rotate-3 transition-all duration-300 shadow-lg group-hover:shadow-purple-500/50">
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
            <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-purple-500 to-pink-600 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left"></div>
          </div>

          <div className="group bg-white/90 border border-white/40 rounded-xl shadow-lg hover:shadow-2xl hover:shadow-green-500/20 transition-all duration-300 transform hover:scale-105 hover:-translate-y-2 p-8 cursor-pointer relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-green-500/5 to-emerald-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            <div className="relative z-10 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-slate-600 uppercase tracking-wider group-hover:text-green-700 transition-colors duration-300">
                  Task Completion
                </h3>
                <p className="text-3xl font-bold text-green-600 group-hover:text-green-700 transition-colors duration-300">
                  {metrics.taskCompletionRate.toFixed(1)}%
                </p>
                <div className="mt-2 text-xs text-slate-500 group-hover:text-green-600 transition-colors duration-300">
                  Completion rate
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

          <div className="group bg-white/90 border border-white/40 rounded-xl shadow-lg hover:shadow-2xl hover:shadow-amber-500/20 transition-all duration-300 transform hover:scale-105 hover:-translate-y-2 p-8 cursor-pointer relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-amber-500/5 to-yellow-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            <div className="relative z-10 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-slate-600 uppercase tracking-wider group-hover:text-amber-700 transition-colors duration-300">
                  Upcoming Tasks
                </h3>
                <p className="text-3xl font-bold text-amber-600 group-hover:text-amber-700 transition-colors duration-300">
                  {metrics.upcomingTasks}
                </p>
                <div className="mt-2 text-xs text-slate-500 group-hover:text-amber-600 transition-colors duration-300">
                  Next 7 days
                </div>
              </div>
              <div className="w-14 h-14 bg-gradient-to-br from-amber-500 to-yellow-600 rounded-xl flex items-center justify-center group-hover:scale-110 group-hover:rotate-3 transition-all duration-300 shadow-lg group-hover:shadow-amber-500/50">
                <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
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
                  Needs attention
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

          {data.users.length > 0 && (
            <div className="group bg-white/90 border border-white/40 rounded-xl shadow-lg hover:shadow-2xl hover:shadow-teal-500/20 transition-all duration-300 transform hover:scale-105 hover:-translate-y-2 p-8 cursor-pointer relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-teal-500/5 to-cyan-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <div className="relative z-10 flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-semibold text-slate-600 uppercase tracking-wider group-hover:text-teal-700 transition-colors duration-300">
                    Total Employees
                  </h3>
                  <p className="text-3xl font-bold text-teal-600 group-hover:text-teal-700 transition-colors duration-300">
                    {metrics.totalUsers}
                  </p>
                  <div className="mt-2 text-xs text-slate-500 group-hover:text-teal-600 transition-colors duration-300">
                    Team members
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
          )}
        </div>

        {/* Updated Charts Layout */}
        <div className="space-y-6">
          {/* First Row - Two Bar Charts (Bigger) */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Leads by Status Bar Chart - Bigger */}
            <div className="group bg-white/90 border border-white/40 rounded-xl shadow-lg hover:shadow-2xl hover:shadow-indigo-500/20 transition-all duration-300 transform hover:scale-[1.02] hover:-translate-y-1 p-6 cursor-pointer relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <div className="relative z-10">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center group-hover:scale-110 group-hover:rotate-6 transition-all duration-300 shadow-lg group-hover:shadow-indigo-500/50">
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
                    <h3 className="text-lg font-semibold text-slate-800 group-hover:text-indigo-700 transition-colors duration-300">
                      Leads by Status
                    </h3>
                    <p className="text-sm text-slate-500 group-hover:text-indigo-600 transition-colors duration-300">
                      Pipeline distribution
                    </p>
                  </div>
                </div>
                <div className="h-80 group-hover:scale-[1.01] transition-transform duration-300">
                  <Bar data={chartData.leadStatusChart} options={chartOptions} />
                </div>
              </div>
              <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 to-purple-600 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left"></div>
            </div>

            {/* Tasks by Priority Bar Chart - Bigger - Changed from orange to cyan */}
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
                      Tasks by Priority
                    </h3>
                    <p className="text-sm text-slate-500 group-hover:text-cyan-600 transition-colors duration-300">
                      Priority distribution
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

          {/* Second Row - Two Pie Charts Side by Side (Same Size) */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Tasks by Status Pie Chart */}
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
                      Tasks by Status
                    </h3>
                    <p className="text-sm text-slate-500 group-hover:text-emerald-600 transition-colors duration-300">
                      Work progress overview
                    </p>
                  </div>
                </div>
                <div className="h-64 group-hover:scale-[1.01] transition-transform duration-300">
                  <Pie data={chartData.taskStatusChart} options={pieChartOptions} />
                </div>
              </div>
              <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-500 to-teal-600 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left"></div>
            </div>

            {/* Clients by Status Doughnut Chart */}
            <div className="group bg-white/90 border border-white/40 rounded-xl shadow-lg hover:shadow-2xl hover:shadow-blue-500/20 transition-all duration-300 transform hover:scale-[1.02] hover:-translate-y-1 p-6 cursor-pointer relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-cyan-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <div className="relative z-10">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-xl flex items-center justify-center group-hover:scale-110 group-hover:rotate-6 transition-all duration-300 shadow-lg group-hover:shadow-blue-500/50">
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
                        d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                      />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-slate-800 group-hover:text-blue-700 transition-colors duration-300">
                      Clients by Status
                    </h3>
                    <p className="text-sm text-slate-500 group-hover:text-blue-600 transition-colors duration-300">
                      Client status distribution
                    </p>
                  </div>
                </div>
                <div className="h-64 group-hover:scale-[1.01] transition-transform duration-300">
                  <Doughnut data={chartData.clientStatusChart} options={pieChartOptions} />
                </div>
              </div>
              <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 to-cyan-600 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left"></div>
            </div>
          </div>

          {/* Third Row - Leads of Company Chart (Standalone, Full Width) */}
          <div className="w-full">
            {data.leads.length > 0 && (
              <div className="group bg-white/90 border border-white/40 rounded-xl shadow-lg hover:shadow-2xl hover:shadow-purple-500/20 transition-all duration-300 transform hover:scale-[1.01] hover:-translate-y-1 p-8 cursor-pointer relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-pink-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                <div className="relative z-10">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl flex items-center justify-center group-hover:scale-110 group-hover:rotate-6 transition-all duration-300 shadow-lg group-hover:shadow-purple-500/50">
                      <svg
                        className="w-6 h-6 text-white group-hover:scale-110 transition-transform duration-300"
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
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold text-slate-800 group-hover:text-purple-700 transition-colors duration-300">
                        Leads of Company
                      </h3>
                      <p className="text-sm text-slate-500 group-hover:text-purple-600 transition-colors duration-300">
                        Individual lead distribution - hover on any slice to see lead details
                      </p>
                    </div>
                  </div>
                  <div className="h-96 group-hover:scale-[1.01] transition-transform duration-300">
                    <Pie data={chartData.individualLeadsChart} options={pieChartOptions} />
                  </div>
                </div>
                <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-purple-500 to-pink-600 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left"></div>
              </div>
            )}
          </div>

          {/* Fourth Row - Three Lists: Leads by Employee, Upcoming Tasks, Overdue Tasks */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Leads by Employee Individual Progress */}
            {data.users.length > 0 && (
              <div className="group bg-white/90 border border-white/40 rounded-xl shadow-lg hover:shadow-2xl hover:shadow-teal-500/20 transition-all duration-300 transform hover:scale-[1.02] hover:-translate-y-1 p-6 cursor-pointer relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-teal-500/5 to-cyan-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                <div className="relative z-10">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 bg-gradient-to-br from-teal-500 to-cyan-600 rounded-xl flex items-center justify-center group-hover:scale-110 group-hover:rotate-6 transition-all duration-300 shadow-lg group-hover:shadow-teal-500/50">
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
                          d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z"
                        />
                      </svg>
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-slate-800 group-hover:text-teal-700 transition-colors duration-300">
                        Leads by Employee
                      </h3>
                      <p className="text-sm text-slate-500 group-hover:text-teal-600 transition-colors duration-300">
                        Individual performance
                      </p>
                    </div>
                  </div>

                  <div className="space-y-3 max-h-64 overflow-y-auto">
                    {chartData.leadsByEmployeeList.map((employee, index) => (
                      <div key={employee.userId}>
                        <div
                          className="group/item p-3 bg-teal-50 rounded-lg border border-teal-100 hover:bg-teal-100 hover:border-teal-200 hover:shadow-md transition-all duration-200 transform hover:scale-[1.02] hover:-translate-y-0.5 cursor-pointer relative overflow-hidden"
                          style={{
                            animationDelay: `${index * 100}ms`,
                            animation: "slideInUp 0.6s ease-out both",
                          }}
                        >
                          <div className="absolute inset-0 bg-gradient-to-r from-teal-500/5 to-cyan-500/5 opacity-0 group-hover/item:opacity-100 transition-opacity duration-200"></div>
                          <div className="relative z-10 flex items-center justify-between mb-2">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 bg-gradient-to-br from-teal-500 to-cyan-600 rounded-full flex items-center justify-center text-white text-sm font-semibold">
                                {employee.username.charAt(0).toUpperCase()}
                              </div>
                              <span className="text-slate-900">{employee.username}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-teal-600 font-semibold">{employee.leadCount}</span>
                              <span className="text-slate-500 text-sm">leads</span>
                            </div>
                          </div>

                          {/* Individual leads for this employee */}
                          <div className="ml-11 space-y-1">
                            {employee.leads.slice(0, 3).map((lead, leadIndex) => (
                              <div key={lead.id} className="text-xs text-slate-600 flex items-center justify-between">
                                <span>
                                  {lead.name} ({lead.company})
                                </span>
                                <span
                                  className={`px-2 py-0.5 rounded-full text-xs ${
                                    lead.status === "CONVERTED"
                                      ? "bg-green-100 text-green-700"
                                      : lead.status === "QUALIFIED"
                                        ? "bg-blue-100 text-blue-700"
                                        : lead.status === "CONTACTED"
                                          ? "bg-yellow-100 text-yellow-700"
                                          : lead.status === "LOST"
                                            ? "bg-red-100 text-red-700"
                                            : "bg-gray-100 text-gray-700"
                                  }}`}
                                >
                                  {lead.status}
                                </span>
                              </div>
                            ))}
                            {employee.leads.length > 3 && (
                              <div className="text-xs text-slate-400">+{employee.leads.length - 3} more leads</div>
                            )}
                          </div>

                          <div className="absolute bottom-0 left-0 w-full h-0.5 bg-gradient-to-r from-teal-500 to-cyan-500 transform scale-x-0 group-hover/item:scale-x-100 transition-transform duration-200 origin-left"></div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-teal-500 to-cyan-600 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left"></div>
              </div>
            )}

            {/* Upcoming Tasks List - NO BLUR EFFECTS */}
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
                        Upcoming Tasks
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
                                Due: {new Date(task.dueDate).toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
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
                      No upcoming tasks
                    </p>
                    <p className="text-xs text-slate-400 group-hover:text-violet-500 transition-colors duration-300 mt-1">
                      All caught up!
                    </p>
                  </div>
                )}
              </div>
              <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-violet-500 to-purple-600 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left"></div>
            </div>

            {/* Overdue Tasks List - NO BLUR EFFECTS */}
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
                        Overdue Tasks
                      </h3>
                      <p className="text-xs text-slate-500 group-hover:text-red-600 transition-colors duration-300">
                        Requires Immediate Attention!
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
                                Overdue: {new Date(task.dueDate).toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
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
                      No overdue tasks
                    </p>
                    <p className="text-xs text-slate-400 group-hover:text-green-500 transition-colors duration-300 mt-1">
                      Great job staying on track!
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