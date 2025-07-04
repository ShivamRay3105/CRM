"use client"
import { useEffect, useState } from "react"
import type React from "react"

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

interface Employee {
  id: number
  name: string
  email: string
  phoneNumber: string
  address: string
  username: string
  position: string
  department: string
}

export default function AdminEmployeesPage() {
  const [employees, setEmployees] = useState<Employee[]>([])
  const [departmentFilter, setDepartmentFilter] = useState("")
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null)
  const [editForm, setEditForm] = useState({
    name: "",
    email: "",
    phoneNumber: "",
    address: "",
    username: "",
    position: "",
    department: "",
  })

  // State to store the current search term from the GlobalSearchBar
  const [currentSearchTerm, setCurrentSearchTerm] = useState("")

  useEffect(() => {
    const fetchEmployees = async () => {
      setLoading(true)
      try {
        const token = localStorage.getItem("token")
        if (!token) {
          setError("No authentication token found. Please log in again.")
          window.location.href = "/login"
          return
        }

        const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/admin/getAllEmployees`, {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          credentials: "include",
        })

        if (!response.ok) {
          if (response.status === 401) {
            setError("Session expired. Please log in again.")
            localStorage.removeItem("token")
            window.location.href = "/login"
            return
          }
          if (response.status === 403) {
            setError("Access denied. You do not have permission to view employees.")
            return
          }
          throw new Error(`Failed to fetch employees: ${response.status}`)
        }

        const data = await response.json()
        const employeesData = Array.isArray(data) ? data : data && Array.isArray(data.content) ? data.content : []
        setEmployees(employeesData)
        setError("")
      } catch (err) {
        setError(`Error loading employees: ${(err as Error).message}`)
        console.error("Fetch employees error:", err)
        setEmployees([])
      } finally {
        setLoading(false)
      }
    }

    fetchEmployees()
  }, [])

  // Callback function passed to GlobalSearchBar
  const handleSearch = (searchTerm: string) => {
    setCurrentSearchTerm(searchTerm)
  }

  const handleEditClick = (employee: Employee) => {
    setEditingEmployee(employee)
    setEditForm({
      name: employee.name,
      email: employee.email,
      phoneNumber: employee.phoneNumber,
      address: employee.address || "",
      username: employee.username,
      position: employee.position,
      department: employee.department,
    })
  }

  const handleEditFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setEditForm((prev) => ({ ...prev, [name]: value }))
  }

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingEmployee) {
      setError("No employee selected for editing")
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
      console.log("Sending update for employee:", editingEmployee.id, "with data:", editForm)
      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/admin/updateEmployee/${editingEmployee.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: editForm.name,
          email: editForm.email,
          phoneNumber: editForm.phoneNumber || "",
          address: editForm.address || null,
          username: editForm.username,
          position: editForm.position,
          department: editForm.department,
        }),
        credentials: "include",
      })
      const responseText = await response.text()
      // Handle 403 specifically
      if (response.status === 403) {
        throw new Error("You do not have permission to update this employee")
      }
      if (!response.ok) {
        throw new Error(responseText || `Update failed with status ${response.status}`)
      }
      console.log("Update successful:", responseText)
      // Update local state
      setEmployees(
        employees.map((employee) => (employee.id === editingEmployee.id ? { ...employee, ...editForm } : employee)),
      )
      setEditingEmployee(null)
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



  function getDepartmentColor(department: string): string {
    const colors = {
      Engineering: "bg-blue-100 text-blue-800 border border-blue-200",
      Marketing: "bg-green-100 text-green-800 border border-green-200",
      Sales: "bg-purple-100 text-purple-800 border border-purple-200",
      HR: "bg-pink-100 text-pink-800 border border-pink-200",
      Finance: "bg-yellow-100 text-yellow-800 border border-yellow-200",
      Operations: "bg-indigo-100 text-indigo-800 border border-indigo-200",
    }
    return colors[department as keyof typeof colors] || "bg-slate-100 text-slate-800 border border-slate-200"
  }

  const isModalOpen = editingEmployee !== null

  // Declare uniqueDepartments and finalFilteredEmployees
  const uniqueDepartments = Array.from(new Set(employees.map((employee) => employee.department)))
  const finalFilteredEmployees = employees.filter((employee) => {
    const matchesSearch =
      employee.name.toLowerCase().includes(currentSearchTerm.toLowerCase()) ||
      employee.email.toLowerCase().includes(currentSearchTerm.toLowerCase()) ||
      employee.position.toLowerCase().includes(currentSearchTerm.toLowerCase()) ||
      employee.department.toLowerCase().includes(currentSearchTerm.toLowerCase())
    const matchesDepartment = departmentFilter === "" || employee.department === departmentFilter
    return matchesSearch && matchesDepartment
  })

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50 to-indigo-100">
      <Navbar role="admin" />

      {/* Animated background elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-purple-300/20 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob"></div>
        <div className="absolute top-1/3 right-1/4 w-64 h-64 bg-indigo-300/20 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-2000"></div>
        <div className="absolute bottom-1/4 left-1/3 w-64 h-64 bg-violet-300/20 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-4000"></div>
      </div>

      {/* Main Content */}
      <div className={`relative transition-all duration-500 ${isModalOpen ? "blur-sm scale-95" : ""}`}>
        {/* Hero Section */}
        <div className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-purple-600/10 to-indigo-600/10"></div>
          <div className="relative container mx-auto px-6 pt-12 pb-8">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-purple-800 via-indigo-700 to-blue-800 bg-clip-text text-transparent mb-4">
                  Employee Management
                </h1>
                <p className="text-lg text-slate-600 font-medium">Manage and oversee all company employees</p>
              </div>
              <div className="hidden md:block">
                <div className="w-24 h-24 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-2xl flex items-center justify-center shadow-xl">
                  <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z"
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
                    searchPlaceholder="Search employees by name, email, position, department..."
                  />
                </div>
                {/* Spacer */}
                <div className="flex-grow hidden md:block"></div>
                {/* Department Filter and Employee Count */}
                <div className="flex items-center gap-4 flex-wrap">
                  <div className="relative group">
                    <select
                      className="appearance-none bg-white/90 backdrop-blur-sm border border-slate-200 rounded-xl px-6 py-3 pr-12 font-medium text-slate-700 shadow-lg hover:shadow-xl transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent hover:border-purple-300"
                      value={departmentFilter}
                      onChange={(e) => setDepartmentFilter(e.target.value)}
                    >
                      <option value="">All Departments</option>
                      {uniqueDepartments.map((dept) => (
                        <option key={dept} value={dept}>
                          {dept}
                        </option>
                      ))}
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
                    {finalFilteredEmployees.length} {finalFilteredEmployees.length === 1 ? "Employee" : "Employees"}
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
              <h3 className="text-xl font-semibold text-slate-700 mb-2">Loading Employees</h3>
              <p className="text-slate-500">Please wait while we fetch employee data...</p>
            </div>
          ) : (
            <>
              {Array.isArray(finalFilteredEmployees) && finalFilteredEmployees.length > 0 ? (
                <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
                  {finalFilteredEmployees.map((employee, index) => (
                    <div
                      key={employee.id}
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
                              {employee.name}
                            </h2>
                            <div className="flex items-center gap-2">
                              <span
                                className={`px-3 py-1 rounded-full text-xs font-semibold ${getDepartmentColor(employee.department)} shadow-sm group-hover:shadow-md transition-all duration-300 transform group-hover:scale-105`}
                              >
                                {employee.department}
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
                              {employee.email}
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
                              {employee.phoneNumber}
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
                                d="M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2-2v2m8 0V6a2 2 0 012 2v6a2 2 0 01-2 2H8a2 2 0 01-2-2V8a2 2 0 012-2h8z"
                              />
                            </svg>
                            <span className="text-sm text-slate-800 font-medium truncate group-hover:text-purple-800 transition-colors duration-300">
                              {employee.position}
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
                              @{employee.username}
                            </span>
                          </div>

                          {employee.address && (
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
                                {employee.address}
                              </span>
                            </div>
                          )}

                          {/* Enhanced Action Buttons */}
                          <div className="flex gap-3 mt-6">
                            <button
                              onClick={() => handleEditClick(employee)}
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
                        d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z"
                      />
                    </svg>
                  </div>
                  <h3 className="text-xl font-semibold text-slate-700 mb-2">No Employees Found</h3>
                  <p className="text-slate-500">
                    {departmentFilter || currentSearchTerm
                      ? `No employees matching your criteria found.`
                      : "No employees available in the system."}
                  </p>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Enhanced Edit Modal */}
      {editingEmployee && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm overflow-y-auto h-full w-full z-50 flex items-center justify-center p-4">
          <div className="relative w-full max-w-2xl bg-white/95 backdrop-blur-lg rounded-3xl shadow-2xl border border-white/30 animate-in fade-in zoom-in duration-300">
            <div className="flex items-center justify-between p-6 border-b border-slate-200">
              <h3 className="text-2xl font-bold bg-gradient-to-r from-purple-800 to-indigo-800 bg-clip-text text-transparent">
                Edit Employee
              </h3>
              <button
                onClick={() => setEditingEmployee(null)}
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
                    <label className="block text-sm font-semibold text-slate-800 mb-2">Phone Number</label>
                    <input
                      type="text"
                      name="phoneNumber"
                      value={editForm.phoneNumber}
                      onChange={handleEditFormChange}
                      className="w-full px-4 py-3 border border-slate-200 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white/90 backdrop-blur-sm transition-all duration-300 text-slate-800 placeholder-slate-400 hover:bg-gradient-to-r hover:from-purple-50/50 hover:to-indigo-50/50"
                    />
                  </div>
                  {/* Username Field */}
                  <div>
                    <label className="block text-sm font-semibold text-slate-800 mb-2">Username</label>
                    <input
                      type="text"
                      name="username"
                      value={editForm.username}
                      onChange={handleEditFormChange}
                      className="w-full px-4 py-3 border border-slate-200 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white/90 backdrop-blur-sm transition-all duration-300 text-slate-800 placeholder-slate-400 hover:bg-gradient-to-r hover:from-purple-50/50 hover:to-indigo-50/50"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  {/* Position Field */}
                  <div>
                    <label className="block text-sm font-semibold text-slate-800 mb-2">Position</label>
                    <input
                      type="text"
                      name="position"
                      value={editForm.position}
                      onChange={handleEditFormChange}
                      className="w-full px-4 py-3 border border-slate-200 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white/90 backdrop-blur-sm transition-all duration-300 text-slate-800 placeholder-slate-400 hover:bg-gradient-to-r hover:from-purple-50/50 hover:to-indigo-50/50"
                    />
                  </div>
                  {/* Department Field */}
                  <div>
                    <label className="block text-sm font-semibold text-slate-800 mb-2">Department</label>
                    <input
                      type="text"
                      name="department"
                      value={editForm.department}
                      onChange={handleEditFormChange}
                      className="w-full px-4 py-3 border border-slate-200 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white/90 backdrop-blur-sm transition-all duration-300 text-slate-800 placeholder-slate-400 hover:bg-gradient-to-r hover:from-purple-50/50 hover:to-indigo-50/50"
                    />
                  </div>
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
                  onClick={() => setEditingEmployee(null)}
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
