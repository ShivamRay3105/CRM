// AdminClientsPage.jsx
'use client';

import { useEffect, useState, useMemo } from 'react';
import Navbar from '../../components/Navbar';

interface GlobalSearchBarProps {
  onSearchChange: (searchTerm: string) => void;
  searchPlaceholder?: string;
}

const GlobalSearchBar = ({
  onSearchChange,
  searchPlaceholder = "Search all items...",
}: GlobalSearchBarProps) => {
  const [searchTerm, setSearchTerm] = useState("");

  // Debounced search effect: calls onSearchChange after a delay
  useEffect(() => {
    const timer = setTimeout(() => {
      onSearchChange(searchTerm);
    }, 300); // 300ms debounce delay

    // Cleanup function to clear the timer if the component unmounts or searchTerm changes again
    return () => clearTimeout(timer);
  }, [searchTerm, onSearchChange]); // Re-run effect when searchTerm or onSearchChange changes

  return (
    // Removed the outer rectangular container and its header
    <div className="relative group w-full"> {/* Ensure it takes full width of its container */}
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
        // Added rounded-full for oval shape, adjusted padding
        className="w-full pl-10 pr-4 py-3 sm:pl-12 sm:pr-4 sm:py-4 border border-slate-200 rounded-full shadow-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white/90 backdrop-blur-sm transition-all duration-300 text-slate-800 placeholder-slate-400 hover:bg-gradient-to-r hover:from-purple-50/50 hover:to-indigo-50/50 group-focus-within:shadow-lg group-focus-within:shadow-purple-500/20"
      />
      {searchTerm && (
        <button
          onClick={() => setSearchTerm("")}
          className="absolute inset-y-0 right-0 pr-3 sm:pr-4 flex items-center text-slate-400 hover:text-purple-600 transition-colors duration-300"
          aria-label="Clear search input"
        >
          <svg
            className="w-4 h-4 sm:w-5 sm:h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      )}
      <div className="absolute inset-0 rounded-full border-2 border-purple-500 opacity-0 group-focus-within:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
    </div>
  );
};


interface Client {
  id: number;
  name: string;
  email: string;
  phone: string;
  company: string;
  status: string;
  address?: string;
  createdAt?: string;
  assignedTo: {
    id: number;
    name: string;
    email: string;
    phoneNumber: string;
    position: string;
  };
}

export default function AdminClientsPage() {
  const [clients, setClients] = useState<Client[]>([]); // This holds all original client data
  const [statusFilter, setStatusFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // State to store the current search term from the GlobalSearchBar
  const [currentSearchTerm, setCurrentSearchTerm] = useState("");

  useEffect(() => {
    const fetchClients = async () => {
      setLoading(true);
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          setError('No authentication token found. Please log in again.');
          // Use standard window.location for redirection
          window.location.href = '/login';
          return;
        }

        const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/admin/getAllClients`, {
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
        });

        if (!response.ok) {
          if (response.status === 401) {
            setError('Session expired. Please log in again.');
            localStorage.removeItem('token');
            // Use standard window.location for redirection
            window.location.href = '/login';
            return;
          }
          if (response.status === 403) {
            setError('Access denied. You do not have permission to view clients.');
            return;
          }
          throw new Error(`Failed to fetch clients: ${response.status}`);
        }

        const data = await response.json();
        setClients(data || []); // Set all fetched clients here
        setError('');
      } catch (err) {
        setError(`Error loading clients: ${(err as Error).message}`);
        console.error('Fetch clients error:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchClients();
  }, []); // Empty dependency array means this runs once on mount

  // Callback function passed to GlobalSearchBar.
  // Updates the currentSearchTerm state.
  const handleSearch = (searchTerm: string) => {
    setCurrentSearchTerm(searchTerm);
  };

  // Combined filtering logic using useMemo for performance
  const finalFilteredClients = useMemo(() => {
    // First, apply the status filter
    const statusFiltered = statusFilter
      ? clients.filter((client) => client.status === statusFilter)
      : clients;

    // Then, apply the global search filter to the status-filtered results
    if (!currentSearchTerm) {
      return statusFiltered; // If no search term, return only status-filtered clients
    }

    const lowerCaseSearchTerm = currentSearchTerm.toLowerCase();

    return statusFiltered.filter((client) => {
      // Customize this logic to search across all relevant client fields
      return (
        client.name.toLowerCase().includes(lowerCaseSearchTerm) ||
        client.email.toLowerCase().includes(lowerCaseSearchTerm) ||
        client.phone.includes(lowerCaseSearchTerm) || // Phone numbers often searched directly
        client.company.toLowerCase().includes(lowerCaseSearchTerm) ||
        client.id.toString().includes(lowerCaseSearchTerm) || // Convert ID to string for searching
        (client.address && client.address.toLowerCase().includes(lowerCaseSearchTerm)) || // Check if address exists before searching
        client.assignedTo.name.toLowerCase().includes(lowerCaseSearchTerm) ||
        client.assignedTo.email.toLowerCase().includes(lowerCaseSearchTerm) ||
        client.assignedTo.phoneNumber.includes(lowerCaseSearchTerm) ||
        client.assignedTo.position.toLowerCase().includes(lowerCaseSearchTerm) // Also search by assignedTo position
      );
    });
  }, [clients, statusFilter, currentSearchTerm]); // Dependencies for useMemo

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
                Admin Client Dashboard
              </h1>
              <p className="text-lg text-slate-600 font-medium">
                Manage all client relationships across the organization
              </p>
            </div>
            <div className="hidden md:block">
              <div className="w-24 h-24 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-xl">
                <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
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
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="text-red-800 font-medium">{error}</span>
            </div>
          </div>
        )}

        {/* Control Panel */}
        <div className="mb-8 bg-white/70 backdrop-blur-sm border border-white/20 rounded-2xl shadow-xl p-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            {/* Adjusted layout for search bar left and filter/count right */}
            <div className="flex flex-grow items-center gap-4 flex-wrap w-full"> {/* Ensure it takes full width */}
              {/* Global Search Bar - Most Left */}
              <div className="flex-grow max-w-full md:max-w-md"> {/* Allows search bar to grow but not too wide */}
                <GlobalSearchBar
                  onSearchChange={handleSearch}
                  searchPlaceholder="Search clients by name, email, company, or phone..."
                />
              </div>

              {/* Spacer to push elements to the right on medium+ screens */}
              <div className="flex-grow hidden md:block"></div>

              {/* Status Filter and Client Count - Grouped to the Right */}
              <div className="flex items-center gap-4 flex-wrap"> {/* Use flex-wrap for smaller screens */}
                {/* Existing select filter */}
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
                  <svg className="absolute right-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>

                {/* Update the client count to use finalFilteredClients */}
                <div className="text-sm text-slate-600 bg-slate-100/80 px-4 py-2 rounded-lg font-medium">
                  {finalFilteredClients.length} {finalFilteredClients.length === 1 ? 'Client' : 'Clients'}
                </div>
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
            <h3 className="text-xl font-semibold text-slate-700 mb-2">Loading Client Data</h3>
            <p className="text-slate-500">Please wait while we fetch all client records...</p>
          </div>
        ) : finalFilteredClients.length === 0 ? (
          <div className="text-center p-16 bg-white/60 backdrop-blur-sm rounded-3xl shadow-xl border border-white/20">
            <div className="w-20 h-20 bg-gradient-to-br from-slate-200 to-slate-300 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <svg className="w-10 h-10 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-slate-700 mb-2">No Clients Found</h3>
            <p className="text-slate-500">
              {statusFilter || currentSearchTerm
                ? `No clients matching your criteria found.`
                : 'No clients available in the system.'}
            </p>
          </div>
        ) : (
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {finalFilteredClients.map((client, index) => (
              <div
                key={client.id}
                className="group bg-white/80 border border-white/20 rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-500 transform hover:scale-[1.02] p-6 relative overflow-hidden"
                style={{ animationDelay: `${index * 100}ms` }}
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
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(client.status)} shadow-sm`}>
                          {client.status}
                        </span>
                      </div>
                    </div>
                    <div className="w-12 h-12 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                      <svg className="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center gap-3 p-3 bg-white/90 rounded-xl border border-slate-100">
                      <svg className="w-4 h-4 text-slate-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                      <span className="text-sm text-slate-800 font-medium truncate">{client.email}</span>
                    </div>

                    <div className="flex items-center gap-3 p-3 bg-white/90 rounded-xl border border-slate-100">
                      <svg className="w-4 h-4 text-slate-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                      </svg>
                      <span className="text-sm text-slate-800 font-medium">{client.phone}</span>
                    </div>

                    <div className="flex items-center gap-3 p-3 bg-white/90 rounded-xl border border-slate-100">
                      <svg className="w-4 h-4 text-slate-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                      </svg>
                      <span className="text-sm text-slate-800 font-medium truncate">{client.company}</span>
                    </div>

                    {client.address && (
                      <div className="flex items-center gap-3 p-3 bg-white/90 rounded-xl border border-slate-100">
                        <svg className="w-4 h-4 text-slate-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        <span className="text-sm text-slate-800 font-medium truncate">{client.address}</span>
                      </div>
                    )}

                    <div className="flex items-center gap-3 p-3 bg-indigo-50/90 rounded-xl border border-indigo-100">
                      <svg className="w-4 h-4 text-indigo-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                      <span className="text-sm text-indigo-800 font-semibold">
                        {client.assignedTo.name} ({client.assignedTo.position})
                      </span>
                    </div>

                    {client.createdAt && (
                      <div className="flex items-center gap-3 p-3 bg-white/90 rounded-xl border border-slate-100">
                        <svg className="w-4 h-4 text-slate-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        <span className="text-sm text-slate-800 font-medium">{new Date(client.createdAt).toLocaleDateString()}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function getStatusColor(status: string): string {
  switch (status) {
    case 'ACTIVE':
      return 'bg-emerald-100 text-emerald-800 border border-emerald-200';
    case 'INACTIVE':
      return 'bg-slate-100 text-slate-800 border border-slate-200';
    case 'ON_HOLD':
      return 'bg-amber-100 text-amber-800 border border-amber-200';
    case 'CLOSED':
      return 'bg-rose-100 text-rose-800 border border-rose-200';
    default:
      return 'bg-slate-100 text-slate-800 border border-slate-200';
  }
}
