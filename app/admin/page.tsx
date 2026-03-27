'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { 
  Users, 
  Bell, 
  Briefcase, 
  Home,
  Search,
  Plus,
  Trash2,
  Edit,
  Check,
  X,
  Mail,
  Calendar,
  MapPin,
  DollarSign,
  Eye,
  EyeOff,
  LogOut,
  Building,
  Phone,
  FileText,
  ShoppingBag,
  Package,
  Ticket,
  Ban,
  QrCode
} from 'lucide-react'
import { getEvents } from '@/lib/events'
import { EventForm } from './EventForm'

// Mock Data
const mockUsers = [
  { id: 1, name: 'Max Mustermann', email: 'max@example.com', role: 'User', status: 'Active', joined: '2024-01-15' },
  { id: 2, name: 'Anna Schmidt', email: 'anna@example.com', role: 'User', status: 'Active', joined: '2024-02-20' },
  { id: 3, name: 'John Doe', email: 'john@example.com', role: 'Admin', status: 'Active', joined: '2023-12-01' },
  { id: 4, name: 'Lisa Müller', email: 'lisa@example.com', role: 'User', status: 'Inactive', joined: '2024-03-10' },
]





export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState('dashboard')
  const [users, setUsers] = useState<any[]>([])
  const [notifications, setNotifications] = useState<any[]>([])
  const [jobs, setJobs] = useState<any[]>([])
  const [events, setEvents] = useState<any[]>([])
  const [rentalInquiries, setRentalInquiries] = useState<any[]>([])
  const [applications, setApplications] = useState<any[]>([])
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null)
  const [merchandise, setMerchandise] = useState<any[]>([])
  const [showAddMerch, setShowAddMerch] = useState(false)
  const [editingMerch, setEditingMerch] = useState<any>(null)
  const [orders, setOrders] = useState<any[]>([])
  const [selectedOrder, setSelectedOrder] = useState<any>(null)
  const [orderFilter, setOrderFilter] = useState('all')
  const [tickets, setTickets] = useState<any[]>([])
  const [ticketFilter, setTicketFilter] = useState('all')
  const [selectedTicket, setSelectedTicket] = useState<any>(null)
  const [showAddUser, setShowAddUser] = useState(false)
  const [showAddJob, setShowAddJob] = useState(false)
  const [editingJob, setEditingJob] = useState<any>(null)
  const [showAddEvent, setShowAddEvent] = useState(false)
  const [editingEvent, setEditingEvent] = useState<any>(null)
  const [searchQuery, setSearchQuery] = useState('')
  
  // New user form state
  const [newUser, setNewUser] = useState({
    name: '',
    email: '',
    role: 'user',
    status: 'active'
  })
  
  // New job form state
  const [newJob, setNewJob] = useState({
    title: '',
    department: '',
    type: 'Full-time',
    location: 'Basel',
    description: '',
    requirements: [] as string[]
  })
  
  // New merchandise form state
  const [newMerch, setNewMerch] = useState({
    name: '',
    description: '',
    price: '',
    category: 'clothing',
    sizes: [] as string[],
    stock: '',
    image: ''
  })

  useEffect(() => {
    loadEvents()
    loadUsers()
    loadNotifications()
    loadRentalInquiries()
    loadApplications()
    loadJobs()
    loadMerchandise()
    loadOrders()
    loadTickets()
  }, [])

  const loadEvents = async () => {
    try {
      const data = await getEvents()
      setEvents(data || [])
    } catch (error) {
      console.error('Error loading events:', error)
    }
  }

  const loadUsers = async () => {
    try {
      const response = await fetch('/api/users')
      if (response.ok) {
        const data = await response.json()
        setUsers(data || [])
      }
    } catch (error) {
      console.error('Error loading users:', error)
    }
  }

  const loadNotifications = async () => {
    try {
      const response = await fetch('/api/notifications')
      if (response.ok) {
        const data = await response.json()
        setNotifications(data || [])
      }
    } catch (error) {
      console.error('Error loading notifications:', error)
    }
  }

  const loadRentalInquiries = async () => {
    try {
      const response = await fetch('/api/rental')
      if (response.ok) {
        const data = await response.json()
        setRentalInquiries(data || [])
      }
    } catch (error) {
      console.error('Error loading rental inquiries:', error)
    }
  }

  // Calculate events for this month
  const currentMonth = new Date().getMonth()
  const currentYear = new Date().getFullYear()
  const eventsThisMonth = events.filter(event => {
    const eventDate = new Date(event.date)
    return eventDate.getMonth() === currentMonth && eventDate.getFullYear() === currentYear
  }).length

  const tabs = [
    { id: 'dashboard', label: 'Dashboard', icon: Home },
    { id: 'events', label: 'Events', icon: Calendar },
    { id: 'tickets', label: 'Tickets', icon: Ticket },
    { id: 'users', label: 'User Management', icon: Users },
    { id: 'rental', label: 'Raumanfragen', icon: Building },
    { id: 'notifications', label: 'Benachrichtigungen', icon: Bell },
    { id: 'careers', label: 'Careers', icon: Briefcase },
    { id: 'merchandise', label: 'Merch', icon: ShoppingBag },
    { id: 'orders', label: 'Bestellungen', icon: Package },
  ]

  const unreadCount = notifications.filter(n => !n.read).length

  const markAsRead = async (id: string) => {
    try {
      const response = await fetch(`/api/notifications/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ read: true })
      })
      if (response.ok) {
        setNotifications(notifications.map(n => n.id === id ? { ...n, read: true } : n))
      }
    } catch (error) {
      console.error('Error marking notification as read:', error)
    }
  }

  const markAllAsRead = async () => {
    try {
      await Promise.all(
        notifications.filter(n => !n.read).map(n => 
          fetch(`/api/notifications/${n.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ read: true })
          })
        )
      )
      setNotifications(notifications.map(n => ({ ...n, read: true })))
    } catch (error) {
      console.error('Error marking all as read:', error)
    }
  }

  const deleteNotification = async (id: string) => {
    try {
      const response = await fetch(`/api/notifications/${id}`, { method: 'DELETE' })
      if (response.ok) {
        setNotifications(notifications.filter(n => n.id !== id))
      }
    } catch (error) {
      console.error('Error deleting notification:', error)
    }
  }

  const updateRentalStatus = async (id: string, status: string) => {
    try {
      console.log('Updating rental status:', id, status)
      const response = await fetch(`/api/rental/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      })
      console.log('Response status:', response.status)
      if (response.ok) {
        const data = await response.json()
        console.log('Updated successfully:', data)
        setRentalInquiries(rentalInquiries.map(r => r.id === id ? { ...r, status } : r))
      } else {
        const error = await response.json()
        console.error('Error response:', error)
        alert('Error: ' + (error.error || 'Failed to update status'))
      }
    } catch (error) {
      console.error('Error updating rental status:', error)
      alert('Error updating status')
    }
  }

  const deleteRentalInquiry = async (id: string) => {
    if (!confirm('Möchtest du diese Anfrage wirklich löschen?')) return
    try {
      const response = await fetch(`/api/rental/${id}`, { method: 'DELETE' })
      if (response.ok) {
        setRentalInquiries(rentalInquiries.filter(r => r.id !== id))
      }
    } catch (error) {
      console.error('Error deleting rental inquiry:', error)
    }
  }

  const loadApplications = async (jobId?: string) => {
    try {
      const url = jobId ? `/api/applications?jobId=${jobId}` : '/api/applications'
      const response = await fetch(url)
      if (response.ok) {
        const data = await response.json()
        setApplications(data || [])
      }
    } catch (error) {
      console.error('Error loading applications:', error)
    }
  }

  const updateApplicationStatus = async (id: string, status: string) => {
    try {
      const response = await fetch(`/api/applications/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      })
      if (response.ok) {
        setApplications(applications.map(a => a.id === id ? { ...a, status } : a))
      }
    } catch (error) {
      console.error('Error updating application status:', error)
    }
  }

  const deleteApplication = async (id: string) => {
    if (!confirm('Möchtest du diese Bewerbung wirklich löschen?')) return
    try {
      const response = await fetch(`/api/applications/${id}`, { method: 'DELETE' })
      if (response.ok) {
        setApplications(applications.filter(a => a.id !== id))
      }
    } catch (error) {
      console.error('Error deleting application:', error)
    }
  }

  const loadJobs = async () => {
    try {
      const response = await fetch('/api/jobs')
      if (response.ok) {
        const data = await response.json()
        setJobs(data || [])
      }
    } catch (error) {
      console.error('Error loading jobs:', error)
    }
  }

  const toggleJobStatus = async (id: string) => {
    const job = jobs.find(j => j.id === id)
    if (!job) return
    
    const newStatus = job.status === 'active' ? 'inactive' : 'active'
    try {
      const response = await fetch(`/api/jobs/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      })
      if (response.ok) {
        setJobs(jobs.map(j => j.id === id ? { ...j, status: newStatus } : j))
      }
    } catch (error) {
      console.error('Error toggling job status:', error)
    }
  }

  const deleteJob = async (id: string) => {
    if (!confirm('Möchtest du diesen Job wirklich löschen?')) return
    try {
      const response = await fetch(`/api/jobs/${id}`, { method: 'DELETE' })
      if (response.ok) {
        setJobs(jobs.filter(j => j.id !== id))
      }
    } catch (error) {
      console.error('Error deleting job:', error)
    }
  }

  const loadMerchandise = async () => {
    try {
      const response = await fetch('/api/merchandise')
      if (response.ok) {
        const data = await response.json()
        setMerchandise(data || [])
      }
    } catch (error) {
      console.error('Error loading merchandise:', error)
    }
  }

  const handleAddMerch = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const response = await fetch('/api/merchandise', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...newMerch,
          price: parseFloat(newMerch.price),
          stock: parseInt(newMerch.stock)
        })
      })
      
      if (response.ok) {
        await loadMerchandise()
        setShowAddMerch(false)
        setNewMerch({ name: '', description: '', price: '', category: 'clothing', sizes: [], stock: '', image: '' })
      } else {
        const error = await response.json()
        alert('Error adding merchandise: ' + (error.error || 'Unknown error'))
      }
    } catch (error) {
      console.error('Error adding merchandise:', error)
      alert('Error adding merchandise')
    }
  }

  const toggleMerchStatus = async (id: string, currentStatus: boolean) => {
    try {
      const response = await fetch(`/api/merchandise/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ active: !currentStatus })
      })
      if (response.ok) {
        setMerchandise(merchandise.map(m => m.id === id ? { ...m, active: !currentStatus } : m))
      }
    } catch (error) {
      console.error('Error toggling merchandise status:', error)
    }
  }

  const deleteMerch = async (id: string) => {
    if (!confirm('Möchtest du diesen Artikel wirklich löschen?')) return
    try {
      const response = await fetch(`/api/merchandise/${id}`, { method: 'DELETE' })
      if (response.ok) {
        setMerchandise(merchandise.filter(m => m.id !== id))
      }
    } catch (error) {
      console.error('Error deleting merchandise:', error)
    }
  }

  // Load orders
  const loadOrders = async () => {
    try {
      const response = await fetch('/api/orders')
      if (response.ok) {
        const data = await response.json()
        console.log('Orders loaded:', data)
        setOrders(data || [])
      } else {
        const error = await response.json()
        console.error('Error loading orders:', error)
      }
    } catch (error) {
      console.error('Error loading orders:', error)
    }
  }

  // Load tickets
  const loadTickets = async () => {
    try {
      const response = await fetch('/api/tickets/admin')
      if (response.ok) {
        const data = await response.json()
        setTickets(data || [])
      }
    } catch (error) {
      console.error('Error loading tickets:', error)
    }
  }

  // Cancel ticket
  const cancelTicket = async (ticketId: string) => {
    if (!confirm('Are you sure you want to cancel this ticket?')) return
    try {
      const response = await fetch(`/api/tickets/${ticketId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'cancelled' })
      })
      if (response.ok) {
        setTickets(tickets.map(t => t.id === ticketId ? { ...t, status: 'cancelled' } : t))
      }
    } catch (error) {
      console.error('Error cancelling ticket:', error)
    }
  }

  // Update order status
  const updateOrderStatus = async (orderId: string, newStatus: string) => {
    try {
      const response = await fetch(`/api/orders/${orderId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      })
      if (response.ok) {
        setOrders(orders.map(o => o.id === orderId ? { ...o, status: newStatus } : o))
      }
    } catch (error) {
      console.error('Error updating order status:', error)
    }
  }

  // Get status color
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-500/20 text-green-500'
      case 'processing': return 'bg-blue-500/20 text-blue-500'
      case 'shipped': return 'bg-purple-500/20 text-purple-500'
      case 'pending': return 'bg-yellow-500/20 text-yellow-500'
      case 'cancelled': return 'bg-red-500/20 text-red-500'
      default: return 'bg-white/10 text-white/60'
    }
  }

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const response = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newUser)
      })
      
      if (response.ok) {
        await loadUsers()
        setShowAddUser(false)
        setNewUser({ name: '', email: '', role: 'user', status: 'active' })
      } else {
        const error = await response.json()
        alert('Error adding user: ' + (error.error || 'Unknown error'))
      }
    } catch (error) {
      console.error('Error adding user:', error)
      alert('Error adding user')
    }
  }

  const handleSaveJob = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const url = editingJob ? `/api/jobs/${editingJob.id}` : '/api/jobs'
      const method = editingJob ? 'PUT' : 'POST'
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newJob)
      })
      
      if (response.ok) {
        await loadJobs()
        setShowAddJob(false)
        setEditingJob(null)
        setNewJob({ title: '', department: '', type: 'Full-time', location: 'Basel', description: '', requirements: [] })
      } else {
        const error = await response.json()
        alert('Error saving job: ' + (error.error || 'Unknown error'))
      }
    } catch (error) {
      console.error('Error saving job:', error)
      alert('Error saving job')
    }
  }

  const deleteUser = async (id: string) => {
    if (!confirm('Are you sure you want to delete this user?')) return
    
    try {
      const response = await fetch(`/api/users/${id}`, { method: 'DELETE' })
      if (response.ok) {
        setUsers(users.filter(u => u.id !== id))
      } else {
        alert('Error deleting user')
      }
    } catch (error) {
      console.error('Error deleting user:', error)
      alert('Error deleting user')
    }
  }

  const handleDeleteEvent = async (id: string) => {
    if (confirm('Are you sure you want to delete this event?')) {
      try {
        const response = await fetch(`/api/events/${id}`, { method: 'DELETE' })
        if (response.ok) {
          setEvents(events.filter(e => e.id !== id))
        }
      } catch (error) {
        console.error('Error deleting event:', error)
      }
    }
  }

  const handleEditEvent = (event: any) => {
    setEditingEvent(event)
    setShowAddEvent(true)
  }

  const filteredUsers = users.filter(u => 
    u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.email.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="min-h-screen bg-black pt-20">
      <div className="flex">
        {/* Sidebar */}
        <aside className="w-64 bg-neutral-900 min-h-screen fixed left-0 top-20 border-r border-white/10">
          <div className="p-6">
            <h2 className="text-xl font-bold text-white mb-8">Admin Panel</h2>
            <nav className="space-y-2">
              {tabs.map((tab) => {
                const Icon = tab.icon
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                      activeTab === tab.id
                        ? 'bg-red-500/20 text-red-500'
                        : 'text-white/70 hover:bg-white/5 hover:text-white'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    <span>{tab.label}</span>
                    {tab.id === 'notifications' && unreadCount > 0 && (
                      <span className="ml-auto bg-red-500 text-white text-xs px-2 py-1 rounded-full">
                        {unreadCount}
                      </span>
                    )}
                  </button>
                )
              })}
            </nav>
          </div>
          <div className="absolute bottom-0 left-0 right-0 p-6 border-t border-white/10">
            <button className="flex items-center gap-3 text-white/70 hover:text-white transition-colors">
              <LogOut className="w-5 h-5" />
              <span>Logout</span>
            </button>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 ml-64 p-8">
          {/* Dashboard */}
          {activeTab === 'dashboard' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <h1 className="text-4xl font-bold text-white mb-8">Dashboard</h1>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <div className="bg-neutral-900/50 rounded-xl p-6 border border-white/10">
                  <div className="flex items-center justify-between mb-4">
                    <Users className="w-8 h-8 text-red-500" />
                    <span className="text-3xl font-bold text-white">{users.length}</span>
                  </div>
                  <p className="text-white/60">Total Users</p>
                </div>
                <div className="bg-neutral-900/50 rounded-xl p-6 border border-white/10">
                  <div className="flex items-center justify-between mb-4">
                    <Bell className="w-8 h-8 text-red-500" />
                    <span className="text-3xl font-bold text-white">{unreadCount}</span>
                  </div>
                  <p className="text-white/60">Unread Notifications</p>
                </div>
                <div className="bg-neutral-900/50 rounded-xl p-6 border border-white/10">
                  <div className="flex items-center justify-between mb-4">
                    <Briefcase className="w-8 h-8 text-red-500" />
                    <span className="text-3xl font-bold text-white">{jobs.filter(j => j.status === 'Active').length}</span>
                  </div>
                  <p className="text-white/60">Active Jobs</p>
                </div>
                <div className="bg-neutral-900/50 rounded-xl p-6 border border-white/10">
                  <div className="flex items-center justify-between mb-4">
                    <Calendar className="w-8 h-8 text-red-500" />
                    <span className="text-3xl font-bold text-white">{eventsThisMonth}</span>
                  </div>
                  <p className="text-white/60">Events This Month</p>
                </div>
              </div>

              {/* Recent Activity */}
              <div className="bg-neutral-900/50 rounded-xl p-6 border border-white/10">
                <h2 className="text-xl font-bold text-white mb-6">Recent Activity</h2>
                <div className="space-y-4">
                  {notifications.slice(0, 5).map((notif) => (
                    <div key={notif.id} className="flex items-start gap-4 p-4 bg-black/30 rounded-lg">
                      <div className={`w-2 h-2 rounded-full mt-2 ${notif.read ? 'bg-white/30' : 'bg-red-500'}`} />
                      <div className="flex-1">
                        <p className="text-white font-medium">{notif.title}</p>
                        <p className="text-white/60 text-sm">{notif.message}</p>
                        <p className="text-white/40 text-xs mt-1">{notif.date}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {/* User Management */}
          {activeTab === 'users' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <div className="flex items-center justify-between mb-8">
                <h1 className="text-4xl font-bold text-white">User Management</h1>
                <button
                  onClick={() => setShowAddUser(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors"
                >
                  <Plus className="w-5 h-5" />
                  Add User
                </button>
              </div>

              {/* Search */}
              <div className="relative mb-6">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
                <input
                  type="text"
                  placeholder="Search users..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 bg-neutral-900/50 border border-white/10 rounded-lg text-white placeholder:text-white/40 focus:outline-none focus:border-red-500"
                />
              </div>

              {/* Users Table */}
              <div className="bg-neutral-900/50 rounded-xl border border-white/10 overflow-hidden">
                <table className="w-full">
                  <thead className="bg-black/30">
                    <tr>
                      <th className="text-left text-white/60 font-medium px-6 py-4">Name</th>
                      <th className="text-left text-white/60 font-medium px-6 py-4">Email</th>
                      <th className="text-left text-white/60 font-medium px-6 py-4">Role</th>
                      <th className="text-left text-white/60 font-medium px-6 py-4">Status</th>
                      <th className="text-left text-white/60 font-medium px-6 py-4">Joined</th>
                      <th className="text-left text-white/60 font-medium px-6 py-4">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredUsers.map((user) => (
                      <tr key={user.id} className="border-t border-white/10">
                        <td className="px-6 py-4 text-white">{user.name}</td>
                        <td className="px-6 py-4 text-white/60">{user.email}</td>
                        <td className="px-6 py-4">
                          <span className={`px-3 py-1 rounded-full text-xs capitalize ${
                            user.role === 'admin' ? 'bg-red-500/20 text-red-500' : 'bg-white/10 text-white/70'
                          }`}>
                            {user.role}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`px-3 py-1 rounded-full text-xs capitalize ${
                            user.status === 'active' ? 'bg-green-500/20 text-green-500' : 'bg-white/10 text-white/70'
                          }`}>
                            {user.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-white/60">{new Date(user.created_at).toLocaleDateString()}</td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <button className="p-2 text-white/60 hover:text-white transition-colors">
                              <Edit className="w-4 h-4" />
                            </button>
                            <button 
                              onClick={() => deleteUser(user.id)}
                              className="p-2 text-white/60 hover:text-red-500 transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </motion.div>
          )}

          {/* Rental Inquiries */}
          {activeTab === 'rental' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <div className="flex items-center justify-between mb-8">
                <h1 className="text-4xl font-bold text-white">Raumanfragen</h1>
                <span className="text-white/60">{rentalInquiries.filter(r => r.status === 'pending').length} pending inquiries</span>
              </div>

              <div className="space-y-4">
                {rentalInquiries.map((inquiry) => (
                  <div 
                    key={inquiry.id} 
                    className={`p-6 rounded-xl border ${inquiry.status === 'pending' ? 'bg-red-500/5 border-red-500/20' : 'bg-neutral-900/30 border-white/10'}`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="font-semibold text-white text-lg">{inquiry.name}</h3>
                          <span className={`px-3 py-1 rounded-full text-xs ${
                            inquiry.status === 'pending' ? 'bg-red-500/20 text-red-500' :
                            inquiry.status === 'contacted' ? 'bg-yellow-500/20 text-yellow-500' :
                            inquiry.status === 'confirmed' ? 'bg-green-500/20 text-green-500' :
                            'bg-red-500/20 text-red-500'
                          }`}>
                            {inquiry.status === 'pending' ? 'Pending' :
                             inquiry.status === 'contacted' ? 'Contacted' :
                             inquiry.status === 'confirmed' ? 'Confirmed' : 'Declined'}
                          </span>
                        </div>
                        
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-white/60 mb-3">
                          <span className="flex items-center gap-2">
                            <Mail className="w-4 h-4 text-red-500" />
                            {inquiry.email}
                          </span>
                          {inquiry.phone && (
                            <span className="flex items-center gap-2">
                              <Phone className="w-4 h-4 text-red-500" />
                              {inquiry.phone}
                            </span>
                          )}
                          <span className="flex items-center gap-2">
                            <Calendar className="w-4 h-4 text-red-500" />
                            {new Date(inquiry.event_date).toLocaleDateString('de-CH')}
                          </span>
                          <span className="flex items-center gap-2">
                            <Users className="w-4 h-4 text-red-500" />
                            {inquiry.guests} Gäste
                          </span>
                        </div>

                        <div className="mb-3">
                          <span className="text-white/40 text-sm">Räume:</span>
                          <div className="flex flex-wrap gap-2 mt-1">
                            {inquiry.rooms?.map((room: string) => (
                              <span key={room} className="px-3 py-1 bg-white/10 rounded-full text-sm text-white">
                                {room}
                              </span>
                            ))}
                          </div>
                        </div>

                        {inquiry.extras?.length > 0 && (
                          <div className="mb-3">
                            <span className="text-white/40 text-sm">Extras:</span>
                            <div className="flex flex-wrap gap-2 mt-1">
                              {inquiry.extras.map((extra: string) => (
                                <span key={extra} className="px-3 py-1 bg-red-500/10 rounded-full text-sm text-red-400">
                                  {extra}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}

                        {inquiry.message && (
                          <p className="text-white/60 text-sm bg-black/30 p-3 rounded-lg mt-3">
                            {inquiry.message}
                          </p>
                        )}

                        <p className="text-white/40 text-xs mt-3">
                          Angefragt am: {new Date(inquiry.created_at).toLocaleString('de-CH')}
                        </p>
                      </div>

                      <div className="flex items-center gap-2 ml-4">
                        <select
                          value={inquiry.status}
                          onChange={(e) => updateRentalStatus(inquiry.id, e.target.value)}
                          className={`px-3 py-1 pr-8 rounded-full text-xs font-medium border-0 cursor-pointer appearance-none bg-transparent ${
                            inquiry.status === 'pending' ? 'text-red-500' :
                            inquiry.status === 'contacted' ? 'text-yellow-500' :
                            inquiry.status === 'confirmed' ? 'text-green-500' :
                            'text-white/60'
                          }`}
                          style={{ 
                            backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3E%3Cpath stroke='%23ffffff' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='m6 8 4 4 4-4'/%3E%3C/svg%3E")`,
                            backgroundPosition: 'right 4px center',
                            backgroundRepeat: 'no-repeat',
                            backgroundSize: '16px'
                          }}
                        >
                          <option value="pending" className="bg-neutral-900 text-red-500">Pending</option>
                          <option value="contacted" className="bg-neutral-900 text-yellow-500">Contacted</option>
                          <option value="confirmed" className="bg-neutral-900 text-green-500">Confirmed</option>
                          <option value="declined" className="bg-neutral-900 text-white/60">Declined</option>
                        </select>
                        <button
                          onClick={() => deleteRentalInquiry(inquiry.id)}
                          className="p-2 text-white/60 hover:text-red-500 transition-colors"
                          title="Delete"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
                
                {rentalInquiries.length === 0 && (
                  <div className="text-center py-12 text-white/40">
                    <Building className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>Keine Raumanfragen vorhanden</p>
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {/* Notifications */}
          {activeTab === 'notifications' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <div className="flex items-center justify-between mb-8">
                <h1 className="text-4xl font-bold text-white">Benachrichtigungszentrum</h1>
                <button
                  onClick={markAllAsRead}
                  className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors"
                >
                  Mark all as read
                </button>
              </div>

              <div className="space-y-4">
                {notifications.map((notif) => (
                  <div 
                    key={notif.id} 
                    className={`p-6 rounded-xl border ${notif.read ? 'bg-neutral-900/30 border-white/10' : 'bg-red-500/5 border-red-500/20'}`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-4">
                        <div className={`w-3 h-3 rounded-full mt-1.5 ${notif.read ? 'bg-white/30' : 'bg-red-500'}`} />
                        <div>
                          <h3 className={`font-semibold ${notif.read ? 'text-white/70' : 'text-white'}`}>
                            {notif.title}
                          </h3>
                          <p className="text-white/60 mt-1">{notif.message}</p>
                          <p className="text-white/40 text-sm mt-2">{new Date(notif.created_at).toLocaleString('de-CH')}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {!notif.read && (
                          <button
                            onClick={() => markAsRead(notif.id)}
                            className="p-2 text-white/60 hover:text-green-500 transition-colors"
                            title="Mark as read"
                          >
                            <Check className="w-5 h-5" />
                          </button>
                        )}
                        <button
                          onClick={() => deleteNotification(notif.id)}
                          className="p-2 text-white/60 hover:text-red-500 transition-colors"
                          title="Delete"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {/* Events */}
          {activeTab === 'events' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <div className="flex items-center justify-between mb-8">
                <h1 className="text-4xl font-bold text-white">Events</h1>
                <button
                  onClick={() => setShowAddEvent(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors"
                >
                  <Plus className="w-5 h-5" />
                  Add Event
                </button>
              </div>

              {/* Events Table */}
              <div className="bg-neutral-900/50 rounded-xl border border-white/10 overflow-hidden">
                <table className="w-full">
                  <thead className="bg-black/30">
                    <tr>
                      <th className="text-left text-white/60 font-medium px-6 py-4">Name</th>
                      <th className="text-left text-white/60 font-medium px-6 py-4">Date</th>
                      <th className="text-left text-white/60 font-medium px-6 py-4">Lineup</th>
                      <th className="text-left text-white/60 font-medium px-6 py-4">Type</th>
                      <th className="text-left text-white/60 font-medium px-6 py-4">Price</th>
                      <th className="text-left text-white/60 font-medium px-6 py-4">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {events.map((event) => (
                      <tr key={event.id} className="border-t border-white/10">
                        <td className="px-6 py-4 text-white font-medium">{event.name}</td>
                        <td className="px-6 py-4 text-white/60">{new Date(event.date).toLocaleDateString('de-CH')}</td>
                        <td className="px-6 py-4">
                          {event.timetable && Array.isArray(event.timetable) && event.timetable.length > 0 ? (
                            <div className="space-y-1">
                              {event.timetable.map((floor: any) => {
                                const isActive = floor.active !== false
                                return (
                                  <div key={floor.name} className={`text-xs ${!isActive ? 'opacity-40' : ''}`}>
                                    <span className="text-red-500 font-medium">{floor.name}:</span>
                                    {isActive ? (
                                      floor.djs && floor.djs.length > 0 ? (
                                        <span className="text-white/60 ml-1">
                                          {floor.djs.map((dj: any) => `${dj.name}${dj.type === 'main' ? '★' : ''}`).join(', ')}
                                        </span>
                                      ) : (
                                        <span className="text-white/40 ml-1 italic">empty</span>
                                      )
                                    ) : (
                                      <span className="text-white/40 ml-1 italic">(inactive)</span>
                                    )}
                                  </div>
                                )
                              })}
                            </div>
                          ) : event.lineup && event.lineup.length > 0 ? (
                            <span className="text-white/60 text-sm">{event.lineup.join(', ')}</span>
                          ) : (
                            <span className="text-white/40 text-sm italic">-</span>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <span className="px-3 py-1 rounded-full text-xs bg-white/10 text-white/70 uppercase">
                            {event.type}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-white/60">{event.price}</td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <button 
                              onClick={() => handleEditEvent(event)}
                              className="p-2 text-white/60 hover:text-white transition-colors"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button 
                              onClick={() => handleDeleteEvent(event.id)}
                              className="p-2 text-white/60 hover:text-red-500 transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </motion.div>
          )}

          {/* Careers */}
          {activeTab === 'careers' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <div className="flex items-center justify-between mb-8">
                <h1 className="text-4xl font-bold text-white">Careers</h1>
                <button
                  onClick={() => setShowAddJob(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors"
                >
                  <Plus className="w-5 h-5" />
                  Add Job
                </button>
              </div>

              <div className="grid gap-6 mb-8">
                {jobs.map((job) => (
                  <div key={job.id} className="bg-neutral-900/50 rounded-xl p-6 border border-white/10">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-4 mb-2">
                          <h3 className="text-xl font-bold text-white">{job.title}</h3>
                          <span className={`px-3 py-1 rounded-full text-xs ${
                            job.status === 'active' ? 'bg-green-500/20 text-green-500' : 'bg-white/10 text-white/70'
                          }`}>
                            {job.status}
                          </span>
                        </div>
                        <div className="flex items-center gap-6 text-white/60 text-sm mb-4">
                          <span className="flex items-center gap-2">
                            <Briefcase className="w-4 h-4" />
                            {job.department}
                          </span>
                          <span className="flex items-center gap-2">
                            <Calendar className="w-4 h-4" />
                            {job.type}
                          </span>
                          <span className="flex items-center gap-2">
                            <MapPin className="w-4 h-4" />
                            {job.location}
                          </span>
                          <button
                            onClick={() => {
                              setSelectedJobId(selectedJobId === job.id ? null : job.id)
                              if (selectedJobId !== job.id) loadApplications(job.id)
                            }}
                            className="flex items-center gap-2 text-red-500 hover:text-red-400 transition-colors"
                          >
                            <Users className="w-4 h-4" />
                            {job.applicants} Applicants
                            {selectedJobId === job.id ? ' ▲' : ' ▼'}
                          </button>
                        </div>

                        {/* Applications for this job */}
                        {selectedJobId === job.id && (
                          <div className="mt-4 border-t border-white/10 pt-4">
                            <h4 className="text-white font-semibold mb-3">Bewerbungen für {job.title}</h4>
                            <div className="space-y-3">
                              {applications.filter(a => a.job_id === job.id).map((app) => (
                                <div 
                                  key={app.id} 
                                  className={`p-4 rounded-lg border ${app.status === 'new' ? 'bg-red-500/5 border-red-500/20' : 'bg-black/30 border-white/10'}`}
                                >
                                  <div className="flex items-start justify-between">
                                    <div className="flex-1">
                                      <div className="flex items-center gap-3 mb-2">
                                        <span className="font-semibold text-white">{app.name}</span>
                                        <span className={`px-2 py-0.5 rounded-full text-xs ${
                                          app.status === 'new' ? 'bg-red-500/20 text-red-500' :
                                          app.status === 'reviewed' ? 'bg-yellow-500/20 text-yellow-500' :
                                          app.status === 'interview' ? 'bg-blue-500/20 text-blue-500' :
                                          app.status === 'hired' ? 'bg-green-500/20 text-green-500' :
                                          'bg-white/10 text-white/60'
                                        }`}>
                                          {app.status === 'new' ? 'Neu' :
                                           app.status === 'reviewed' ? 'Geprüft' :
                                           app.status === 'interview' ? 'Interview' :
                                           app.status === 'hired' ? 'Eingestellt' : 'Abgelehnt'}
                                        </span>
                                      </div>
                                      <div className="flex flex-wrap items-center gap-4 text-sm text-white/60 mb-2">
                                        <span className="flex items-center gap-1">
                                          <Mail className="w-3 h-3 text-red-500" />
                                          {app.email}
                                        </span>
                                        {app.phone && (
                                          <span className="flex items-center gap-1">
                                            <Phone className="w-3 h-3 text-red-500" />
                                            {app.phone}
                                          </span>
                                        )}
                                        <span className="text-white/40">
                                          {new Date(app.created_at).toLocaleDateString('de-CH')}
                                        </span>
                                      </div>
                                      {app.message && (
                                        <p className="text-white/60 text-sm bg-black/30 p-2 rounded mt-2">
                                          {app.message}
                                        </p>
                                      )}
                                      {app.cv_url && (
                                        <a 
                                          href={app.cv_url} 
                                          target="_blank" 
                                          rel="noopener noreferrer"
                                          className="inline-flex items-center gap-1 text-red-500 hover:text-red-400 text-sm mt-2"
                                        >
                                          <FileText className="w-4 h-4" />
                                          Lebenslauf ansehen
                                        </a>
                                      )}
                                    </div>
                                    <div className="flex items-center gap-1 ml-4">
                                      <select
                                        value={app.status}
                                        onChange={(e) => updateApplicationStatus(app.id, e.target.value)}
                                        className="px-2 py-1 bg-black border border-white/20 rounded text-sm text-white"
                                      >
                                        <option value="new">Neu</option>
                                        <option value="reviewed">Geprüft</option>
                                        <option value="interview">Interview</option>
                                        <option value="hired">Eingestellt</option>
                                        <option value="rejected">Abgelehnt</option>
                                      </select>
                                      <button
                                        onClick={() => deleteApplication(app.id)}
                                        className="p-2 text-white/40 hover:text-red-500 transition-colors"
                                        title="Löschen"
                                      >
                                        <Trash2 className="w-4 h-4" />
                                      </button>
                                    </div>
                                  </div>
                                </div>
                              ))}
                              {applications.filter(a => a.job_id === job.id).length === 0 && (
                                <p className="text-white/40 text-sm italic">Keine Bewerbungen für diese Position</p>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => toggleJobStatus(job.id)}
                          className="p-2 text-white/60 hover:text-white transition-colors"
                          title={job.status === 'active' ? 'Deactivate' : 'Activate'}
                        >
                          {job.status === 'active' ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                        </button>
                        <button 
                          onClick={() => {
                            setEditingJob(job)
                            setNewJob({
                              title: job.title,
                              department: job.department,
                              type: job.type,
                              location: job.location,
                              description: job.description || '',
                              requirements: job.requirements || []
                            })
                          }}
                          className="p-2 text-white/60 hover:text-white transition-colors"
                          title="Edit"
                        >
                          <Edit className="w-5 h-5" />
                        </button>
                        <button 
                          onClick={() => deleteJob(job.id)}
                          className="p-2 text-white/60 hover:text-red-500 transition-colors"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {/* Merchandise */}
          {activeTab === 'merchandise' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <div className="flex items-center justify-between mb-8">
                <h1 className="text-4xl font-bold text-white">Merchandise</h1>
                <button
                  onClick={() => setShowAddMerch(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors"
                >
                  <Plus className="w-5 h-5" />
                  Add Product
                </button>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                <div className="bg-neutral-900/50 rounded-xl p-6 border border-white/10">
                  <div className="flex items-center justify-between mb-4">
                    <Package className="w-8 h-8 text-red-500" />
                    <span className="text-3xl font-bold text-white">{merchandise.length}</span>
                  </div>
                  <p className="text-white/60">Total Products</p>
                </div>
                <div className="bg-neutral-900/50 rounded-xl p-6 border border-white/10">
                  <div className="flex items-center justify-between mb-4">
                    <Eye className="w-8 h-8 text-green-500" />
                    <span className="text-3xl font-bold text-white">{merchandise.filter(m => m.active).length}</span>
                  </div>
                  <p className="text-white/60">Active</p>
                </div>
                <div className="bg-neutral-900/50 rounded-xl p-6 border border-white/10">
                  <div className="flex items-center justify-between mb-4">
                    <EyeOff className="w-8 h-8 text-white/50" />
                    <span className="text-3xl font-bold text-white">{merchandise.filter(m => !m.active).length}</span>
                  </div>
                  <p className="text-white/60">Inactive</p>
                </div>
                <div className="bg-neutral-900/50 rounded-xl p-6 border border-white/10">
                  <div className="flex items-center justify-between mb-4">
                    <DollarSign className="w-8 h-8 text-yellow-500" />
                    <span className="text-3xl font-bold text-white">
                      {merchandise.reduce((sum, m) => sum + (m.stock || 0), 0)}
                    </span>
                  </div>
                  <p className="text-white/60">Total Stock</p>
                </div>
              </div>

              {/* Products Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {merchandise.map((item) => (
                  <div key={item.id} className="bg-neutral-900/50 rounded-xl overflow-hidden border border-white/10">
                    {/* Image */}
                    <div className="aspect-square bg-neutral-800 relative">
                      {item.image ? (
                        <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <ShoppingBag className="w-16 h-16 text-white/20" />
                        </div>
                      )}
                      <span className={`absolute top-2 right-2 px-2 py-1 rounded text-xs ${
                        item.active ? 'bg-green-500/20 text-green-500' : 'bg-white/10 text-white/60'
                      }`}>
                        {item.active ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                    
                    {/* Info */}
                    <div className="p-4">
                      <div className="flex items-start justify-between mb-2">
                        <h3 className="font-semibold text-white">{item.name}</h3>
                        <span className="text-red-500 font-bold">CHF {item.price}</span>
                      </div>
                      <p className="text-white/60 text-sm mb-3 line-clamp-2">{item.description}</p>
                      
                      <div className="flex flex-wrap gap-2 mb-3">
                        {item.sizes?.map((size: string) => (
                          <span key={size} className="px-2 py-1 bg-white/10 rounded text-xs text-white">
                            {size}
                          </span>
                        ))}
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <span className={`text-sm ${item.stock < 10 ? 'text-red-400' : 'text-white/60'}`}>
                          Stock: {item.stock}
                        </span>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => toggleMerchStatus(item.id, item.active)}
                            className="p-2 text-white/60 hover:text-white transition-colors"
                            title={item.active ? 'Deactivate' : 'Activate'}
                          >
                            {item.active ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                          <button
                            onClick={() => deleteMerch(item.id)}
                            className="p-2 text-white/60 hover:text-red-500 transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {merchandise.length === 0 && (
                <div className="text-center py-12 text-white/40">
                  <ShoppingBag className="w-16 h-16 mx-auto mb-4 opacity-50" />
                  <p>No merchandise yet</p>
                </div>
              )}
            </motion.div>
          )}

          {/* Orders */}
          {activeTab === 'orders' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              {/* Header */}
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-white">Orders</h2>
                <div className="flex items-center gap-3">
                  <select
                    value={orderFilter}
                    onChange={(e) => setOrderFilter(e.target.value)}
                    className="px-4 py-2 bg-black/50 border border-white/10 rounded-lg text-white focus:outline-none focus:border-red-500"
                  >
                    <option value="all">All Orders</option>
                    <option value="pending">Pending</option>
                    <option value="processing">Processing</option>
                    <option value="shipped">Shipped</option>
                    <option value="completed">Completed</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-neutral-900/50 rounded-xl p-4 border border-white/10">
                  <p className="text-2xl font-bold text-white">{orders.length}</p>
                  <p className="text-white/60 text-sm">Total Orders</p>
                </div>
                <div className="bg-neutral-900/50 rounded-xl p-4 border border-white/10">
                  <p className="text-2xl font-bold text-yellow-500">{orders.filter(o => o.status === 'pending').length}</p>
                  <p className="text-white/60 text-sm">Pending</p>
                </div>
                <div className="bg-neutral-900/50 rounded-xl p-4 border border-white/10">
                  <p className="text-2xl font-bold text-blue-500">{orders.filter(o => o.status === 'processing').length}</p>
                  <p className="text-white/60 text-sm">Processing</p>
                </div>
                <div className="bg-neutral-900/50 rounded-xl p-4 border border-white/10">
                  <p className="text-2xl font-bold text-green-500">
                    CHF {orders.reduce((sum, o) => sum + (o.total || 0), 0).toFixed(2)}
                  </p>
                  <p className="text-white/60 text-sm">Total Revenue</p>
                </div>
              </div>

              {/* Orders Table */}
              <div className="bg-neutral-900/50 rounded-xl border border-white/10 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-black/30">
                      <tr>
                        <th className="px-4 py-3 text-left text-white/60 font-medium text-sm">Order Number</th>
                        <th className="px-4 py-3 text-left text-white/60 font-medium text-sm">Customer</th>
                        <th className="px-4 py-3 text-left text-white/60 font-medium text-sm">Date</th>
                        <th className="px-4 py-3 text-left text-white/60 font-medium text-sm">Total</th>
                        <th className="px-4 py-3 text-left text-white/60 font-medium text-sm">Status</th>
                        <th className="px-4 py-3 text-left text-white/60 font-medium text-sm">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {orders
                        .filter(order => orderFilter === 'all' || order.status === orderFilter)
                        .map((order) => (
                        <tr key={order.id} className="hover:bg-white/5">
                          <td className="px-4 py-3">
                            <span className="text-white font-mono text-sm">{order.order_number}</span>
                          </td>
                          <td className="px-4 py-3">
                            <div>
                              <p className="text-white text-sm">{order.customer_name || order.customer_email}</p>
                              <p className="text-white/40 text-xs">{order.customer_email}</p>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <span className="text-white/60 text-sm">
                              {new Date(order.created_at).toLocaleDateString('de-CH')}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <span className="text-white font-semibold">CHF {(order.total || 0).toFixed(2)}</span>
                          </td>
                          <td className="px-4 py-3">
                            <select
                              value={order.status}
                              onChange={(e) => updateOrderStatus(order.id, e.target.value)}
                              className={`px-3 py-1 rounded-full text-xs font-medium border-0 cursor-pointer ${getStatusColor(order.status)}`}
                            >
                              <option value="pending">Pending</option>
                              <option value="processing">Processing</option>
                              <option value="shipped">Shipped</option>
                              <option value="completed">Completed</option>
                              <option value="cancelled">Cancelled</option>
                            </select>
                          </td>
                          <td className="px-4 py-3">
                            <button
                              onClick={() => setSelectedOrder(order)}
                              className="p-2 text-white/60 hover:text-white transition-colors"
                              title="View Details"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {orders.filter(order => orderFilter === 'all' || order.status === orderFilter).length === 0 && (
                  <div className="text-center py-12 text-white/40">
                    <Package className="w-16 h-16 mx-auto mb-4 opacity-50" />
                    <p>No orders found</p>
                  </div>
                )}
              </div>

              {/* Order Detail Modal */}
              {selectedOrder && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="bg-neutral-900 rounded-2xl p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-white/10"
                  >
                    <div className="flex items-center justify-between mb-6">
                      <h2 className="text-2xl font-bold text-white">Bestellung Details</h2>
                      <button
                        onClick={() => setSelectedOrder(null)}
                        className="p-2 text-white/60 hover:text-white"
                      >
                        <X className="w-6 h-6" />
                      </button>
                    </div>

                    <div className="space-y-6">
                      {/* Order Info */}
                      <div className="grid grid-cols-2 gap-4">
                        <div className="bg-black/30 rounded-lg p-4">
                          <p className="text-white/60 text-sm mb-1">Order ID</p>
                          <p className="text-white font-mono">{selectedOrder.id}</p>
                        </div>
                        <div className="bg-black/30 rounded-lg p-4">
                          <p className="text-white/60 text-sm mb-1">Datum</p>
                          <p className="text-white">{new Date(selectedOrder.created_at).toLocaleString('de-CH')}</p>
                        </div>
                      </div>

                      {/* Customer Info */}
                      <div className="bg-black/30 rounded-lg p-4">
                        <h3 className="text-white font-semibold mb-3">Kunde</h3>
                        <p className="text-white">{selectedOrder.customer_name}</p>
                        <p className="text-white/60">{selectedOrder.customer_email}</p>
                        {selectedOrder.shipping_address && (
                          <div className="mt-3 text-white/60 text-sm">
                            <p>{selectedOrder.shipping_address.street}</p>
                            <p>{selectedOrder.shipping_address.zip} {selectedOrder.shipping_address.city}</p>
                            <p>{selectedOrder.shipping_address.country}</p>
                          </div>
                        )}
                      </div>

                      {/* Items */}
                      <div>
                        <h3 className="text-white font-semibold mb-3">Artikel</h3>
                        <div className="space-y-2">
                          {selectedOrder.items?.map((item: any, idx: number) => (
                            <div key={idx} className="flex items-center justify-between bg-black/30 rounded-lg p-3">
                              <div className="flex items-center gap-3">
                                {item.image && (
                                  <img src={item.image} alt={item.name} className="w-12 h-12 object-cover rounded" />
                                )}
                                <div>
                                  <p className="text-white font-medium">{item.name}</p>
                                  <p className="text-white/60 text-sm">Qty: {item.quantity} {item.size && `• ${item.size}`}</p>
                                </div>
                              </div>
                              <p className="text-white font-semibold">CHF {(item.price * item.quantity).toFixed(2)}</p>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Total */}
                      <div className="border-t border-white/10 pt-4">
                        <div className="flex items-center justify-between">
                          <span className="text-white/60">Zwischensumme</span>
                          <span className="text-white">CHF {(selectedOrder.subtotal || 0).toFixed(2)}</span>
                        </div>
                        <div className="flex items-center justify-between mt-2">
                          <span className="text-white/60">Versand</span>
                          <span className="text-white">CHF {(selectedOrder.shipping || 0).toFixed(2)}</span>
                        </div>
                        <div className="flex items-center justify-between mt-3 pt-3 border-t border-white/10">
                          <span className="text-white font-semibold">Total</span>
                          <span className="text-white text-xl font-bold">CHF {(selectedOrder.total || 0).toFixed(2)}</span>
                        </div>
                      </div>

                      {/* Status Update */}
                      <div className="flex items-center gap-4 pt-4">
                        <span className="text-white/60">Status ändern:</span>
                        <select
                          value={selectedOrder.status}
                          onChange={(e) => {
                            updateOrderStatus(selectedOrder.id, e.target.value)
                            setSelectedOrder({ ...selectedOrder, status: e.target.value })
                          }}
                          className="px-4 py-2 bg-black/50 border border-white/10 rounded-lg text-white focus:outline-none focus:border-red-500"
                        >
                          <option value="pending">Ausstehend</option>
                          <option value="processing">In Bearbeitung</option>
                          <option value="shipped">Versendet</option>
                          <option value="completed">Abgeschlossen</option>
                          <option value="cancelled">Storniert</option>
                        </select>
                      </div>
                    </div>
                  </motion.div>
                </div>
              )}
            </motion.div>
          )}

          {/* Tickets */}
          {activeTab === 'tickets' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              {/* Header */}
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-white">Tickets</h2>
                <div className="flex items-center gap-3">
                  <select
                    value={ticketFilter}
                    onChange={(e) => setTicketFilter(e.target.value)}
                    className="px-4 py-2 bg-black/50 border border-white/10 rounded-lg text-white focus:outline-none focus:border-red-500"
                  >
                    <option value="all">All Tickets</option>
                    <option value="valid">Valid</option>
                    <option value="used">Used</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-neutral-900/50 rounded-xl p-4 border border-white/10">
                  <p className="text-2xl font-bold text-white">{tickets.length}</p>
                  <p className="text-white/60 text-sm">Total Tickets</p>
                </div>
                <div className="bg-neutral-900/50 rounded-xl p-4 border border-white/10">
                  <p className="text-2xl font-bold text-green-500">{tickets.filter(t => t.status === 'valid').length}</p>
                  <p className="text-white/60 text-sm">Valid</p>
                </div>
                <div className="bg-neutral-900/50 rounded-xl p-4 border border-white/10">
                  <p className="text-2xl font-bold text-blue-500">{tickets.filter(t => t.status === 'used').length}</p>
                  <p className="text-white/60 text-sm">Used</p>
                </div>
                <div className="bg-neutral-900/50 rounded-xl p-4 border border-white/10">
                  <p className="text-2xl font-bold text-red-500">{tickets.filter(t => t.status === 'cancelled').length}</p>
                  <p className="text-white/60 text-sm">Cancelled</p>
                </div>
              </div>

              {/* Tickets Table */}
              <div className="bg-neutral-900/50 rounded-xl border border-white/10 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-black/30">
                      <tr>
                        <th className="px-4 py-3 text-left text-white/60 font-medium text-sm">Ticket Number</th>
                        <th className="px-4 py-3 text-left text-white/60 font-medium text-sm">Event</th>
                        <th className="px-4 py-3 text-left text-white/60 font-medium text-sm">Customer</th>
                        <th className="px-4 py-3 text-left text-white/60 font-medium text-sm">Date</th>
                        <th className="px-4 py-3 text-left text-white/60 font-medium text-sm">Ticket Status</th>
                        <th className="px-4 py-3 text-left text-white/60 font-medium text-sm">Payment</th>
                        <th className="px-4 py-3 text-left text-white/60 font-medium text-sm">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {tickets
                        .filter(ticket => ticketFilter === 'all' || ticket.status === ticketFilter)
                        .map((ticket) => (
                        <tr key={ticket.id} className="hover:bg-white/5">
                          <td className="px-4 py-3">
                            <span className="text-white font-mono text-sm">{ticket.ticket_number}</span>
                          </td>
                          <td className="px-4 py-3">
                            <span className="text-white text-sm">{ticket.event?.name || 'Unknown Event'}</span>
                          </td>
                          <td className="px-4 py-3">
                            <div>
                              <p className="text-white text-sm">{ticket.holder_name}</p>
                              <p className="text-white/40 text-xs">{ticket.holder_email}</p>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <span className="text-white/60 text-sm">
                              {new Date(ticket.created_at).toLocaleDateString('de-CH')}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <span className={`px-3 py-1 rounded-full text-xs ${
                              ticket.status === 'valid' ? 'bg-green-500/20 text-green-500' :
                              ticket.status === 'used' ? 'bg-blue-500/20 text-blue-500' :
                              ticket.status === 'cancelled' ? 'bg-red-500/20 text-red-500' :
                              'bg-white/10 text-white/60'
                            }`}>
                              {ticket.status}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <span className={`px-3 py-1 rounded-full text-xs ${
                              ticket.payment_status === 'paid' ? 'bg-green-500/20 text-green-500' :
                              ticket.payment_status === 'pending' ? 'bg-yellow-500/20 text-yellow-500' :
                              ticket.payment_status === 'failed' ? 'bg-red-500/20 text-red-500' :
                              'bg-white/10 text-white/60'
                            }`}>
                              {ticket.payment_status || 'pending'}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => setSelectedTicket(ticket)}
                                className="p-2 text-white/60 hover:text-blue-500 transition-colors"
                                title="View Details"
                              >
                                <Eye className="w-4 h-4" />
                              </button>
                              {ticket.status !== 'cancelled' && (
                                <button
                                  onClick={() => cancelTicket(ticket.id)}
                                  className="p-2 text-white/60 hover:text-red-500 transition-colors"
                                  title="Cancel Ticket"
                                >
                                  <Ban className="w-4 h-4" />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {tickets.filter(ticket => ticketFilter === 'all' || ticket.status === ticketFilter).length === 0 && (
                  <div className="text-center py-12 text-white/40">
                    <Ticket className="w-16 h-16 mx-auto mb-4 opacity-50" />
                    <p>No tickets found</p>
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {/* Ticket Details Modal */}
          {selectedTicket && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-neutral-900 rounded-xl p-5 max-w-sm w-full border border-white/10 max-h-[85vh] overflow-y-auto"
              >
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-bold text-white">Ticket Details</h2>
                  <button
                    onClick={() => setSelectedTicket(null)}
                    className="p-1.5 text-white/60 hover:text-white"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="space-y-3">
                  {/* QR Code - Compact */}
                  <div className="bg-white rounded-lg p-3 flex flex-col items-center">
                    <QrCode className="w-20 h-20 text-black" />
                    <p className="text-black/60 text-[10px] mt-1 font-mono truncate max-w-full">{selectedTicket.qr_code}</p>
                  </div>

                  {/* Ticket Number */}
                  <div className="bg-black/30 rounded-lg p-2.5">
                    <p className="text-white/50 text-xs mb-0.5">Ticket Number</p>
                    <p className="text-white font-mono text-sm">{selectedTicket.ticket_number}</p>
                  </div>

                  {/* Event & Customer - Side by side */}
                  <div className="grid grid-cols-2 gap-2">
                    <div className="bg-black/30 rounded-lg p-2.5">
                      <p className="text-white/50 text-xs mb-0.5">Event</p>
                      <p className="text-white text-sm font-medium truncate">{selectedTicket.event?.name || 'Unknown'}</p>
                      <p className="text-white/40 text-[10px]">
                        {selectedTicket.event?.date && new Date(selectedTicket.event.date).toLocaleDateString('de-CH')}
                      </p>
                    </div>
                    <div className="bg-black/30 rounded-lg p-2.5">
                      <p className="text-white/50 text-xs mb-0.5">Customer</p>
                      <p className="text-white text-sm font-medium truncate">{selectedTicket.holder_name}</p>
                      <p className="text-white/40 text-[10px] truncate">{selectedTicket.holder_email}</p>
                    </div>
                  </div>

                  {/* Status - Side by side */}
                  <div className="grid grid-cols-2 gap-2">
                    <div className="bg-black/30 rounded-lg p-2.5">
                      <p className="text-white/50 text-xs mb-1">Ticket</p>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] ${
                        selectedTicket.status === 'valid' ? 'bg-green-500/20 text-green-500' :
                        selectedTicket.status === 'used' ? 'bg-blue-500/20 text-blue-500' :
                        selectedTicket.status === 'cancelled' ? 'bg-red-500/20 text-red-500' :
                        'bg-white/10 text-white/60'
                      }`}>
                        {selectedTicket.status}
                      </span>
                    </div>
                    <div className="bg-black/30 rounded-lg p-2.5">
                      <p className="text-white/50 text-xs mb-1">Payment</p>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] ${
                        selectedTicket.payment_status === 'paid' ? 'bg-green-500/20 text-green-500' :
                        selectedTicket.payment_status === 'pending' ? 'bg-yellow-500/20 text-yellow-500' :
                        selectedTicket.payment_status === 'failed' ? 'bg-red-500/20 text-red-500' :
                        'bg-white/10 text-white/60'
                      }`}>
                        {selectedTicket.payment_status || 'pending'}
                      </span>
                    </div>
                  </div>

                  {/* Payment Info */}
                  {selectedTicket.order && (
                    <div className="bg-black/30 rounded-lg p-2.5">
                      <p className="text-white/50 text-xs mb-1.5">Payment Info</p>
                      <div className="space-y-1 text-xs">
                        <div className="flex justify-between">
                          <span className="text-white/40">Method:</span>
                          <span className="text-white capitalize">{selectedTicket.order.payment_method?.replace('_', ' ') || 'N/A'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-white/40">Order Status:</span>
                          <span className={`capitalize ${
                            selectedTicket.order.status === 'completed' ? 'text-green-500' :
                            selectedTicket.order.status === 'pending' ? 'text-yellow-500' :
                            selectedTicket.order.status === 'failed' ? 'text-red-500' :
                            'text-white/60'
                          }`}>{selectedTicket.order.status || 'N/A'}</span>
                        </div>
                        {selectedTicket.order.total_amount && (
                          <div className="flex justify-between">
                            <span className="text-white/40">Amount:</span>
                            <span className="text-white">CHF {selectedTicket.order.total_amount.toFixed(2)}</span>
                          </div>
                        )}
                        {selectedTicket.order.payment_details?.reference && (
                          <div className="flex justify-between">
                            <span className="text-white/40">Reference:</span>
                            <span className="text-white font-mono text-[10px]">{selectedTicket.order.payment_details.reference}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Created Date */}
                  <div className="bg-black/30 rounded-lg p-2.5">
                    <p className="text-white/50 text-xs mb-0.5">Created</p>
                    <p className="text-white text-xs">
                      {new Date(selectedTicket.created_at).toLocaleString('de-CH')}
                    </p>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 pt-2">
                    {(selectedTicket.payment_status === 'pending' || !selectedTicket.payment_status) && (
                      <button
                        onClick={async () => {
                          try {
                            const res = await fetch('/api/tickets/admin/payment', {
                              method: 'POST',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({ ticket_id: selectedTicket.id, status: 'paid' })
                            })
                            if (res.ok) {
                              setSelectedTicket({ ...selectedTicket, payment_status: 'paid' })
                              loadTickets()
                            } else {
                              const err = await res.json()
                              alert('Error: ' + (err.error || 'Failed to update'))
                            }
                          } catch (err) {
                            console.error('Error updating payment status:', err)
                            alert('Error updating payment status')
                          }
                        }}
                        className="flex-1 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-medium"
                      >
                        Mark as Paid
                      </button>
                    )}
                    {selectedTicket.status !== 'cancelled' && (
                      <button
                        onClick={() => {
                          cancelTicket(selectedTicket.id)
                          setSelectedTicket(null)
                        }}
                        className="flex-1 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-medium"
                      >
                        Cancel Ticket
                      </button>
                    )}
                  </div>
                </div>
              </motion.div>
            </div>
          )}

          {/* Add/Edit Event Modal */}
          {showAddEvent && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-neutral-900 rounded-2xl p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-white/10"
              >
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-white">
                    {editingEvent ? 'Edit Event' : 'Add New Event'}
                  </h2>
                  <button
                    onClick={() => {
                      setShowAddEvent(false)
                      setEditingEvent(null)
                    }}
                    className="p-2 text-white/60 hover:text-white"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>
                <EventForm 
                  event={editingEvent}
                  onClose={() => {
                    setShowAddEvent(false)
                    setEditingEvent(null)
                  }}
                  onSuccess={() => {
                    loadEvents()
                    setShowAddEvent(false)
                    setEditingEvent(null)
                  }}
                />
              </motion.div>
            </div>
          )}

          {/* Add User Modal */}
          {showAddUser && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-neutral-900 rounded-2xl p-8 max-w-md w-full border border-white/10"
              >
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-white">Add New User</h2>
                  <button
                    onClick={() => setShowAddUser(false)}
                    className="p-2 text-white/60 hover:text-white"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>
                <form onSubmit={handleAddUser} className="space-y-4">
                  <div>
                    <label className="block text-white/70 text-sm mb-2">Name</label>
                    <input
                      type="text"
                      value={newUser.name}
                      onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
                      className="w-full px-4 py-3 bg-black/50 border border-white/10 rounded-lg text-white placeholder:text-white/40 focus:outline-none focus:border-red-500"
                      placeholder="Enter name"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-white/70 text-sm mb-2">Email</label>
                    <input
                      type="email"
                      value={newUser.email}
                      onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                      className="w-full px-4 py-3 bg-black/50 border border-white/10 rounded-lg text-white placeholder:text-white/40 focus:outline-none focus:border-red-500"
                      placeholder="Enter email"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-white/70 text-sm mb-2">Role</label>
                    <select
                      value={newUser.role}
                      onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}
                      className="w-full px-4 py-3 bg-black/50 border border-white/10 rounded-lg text-white focus:outline-none focus:border-red-500"
                    >
                      <option value="user">User</option>
                      <option value="admin">Admin</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-white/70 text-sm mb-2">Status</label>
                    <select
                      value={newUser.status}
                      onChange={(e) => setNewUser({ ...newUser, status: e.target.value })}
                      className="w-full px-4 py-3 bg-black/50 border border-white/10 rounded-lg text-white focus:outline-none focus:border-red-500"
                    >
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                    </select>
                  </div>
                  <div className="flex gap-3 pt-4">
                    <button
                      type="button"
                      onClick={() => setShowAddUser(false)}
                      className="flex-1 px-4 py-3 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="flex-1 px-4 py-3 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors"
                    >
                      Add User
                    </button>
                  </div>
                </form>
              </motion.div>
            </div>
          )}

          {/* Add Job Modal */}
          {(showAddJob || editingJob) && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-neutral-900 rounded-2xl p-8 max-w-md w-full border border-white/10"
              >
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-white">Add New Job</h2>
                  <button
                    onClick={() => setShowAddJob(false)}
                    className="p-2 text-white/60 hover:text-white"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>
                <form onSubmit={handleSaveJob} className="space-y-4">
                  <div>
                    <label className="block text-white/70 text-sm mb-2">Job Title</label>
                    <input
                      type="text"
                      value={newJob.title}
                      onChange={(e) => setNewJob({ ...newJob, title: e.target.value })}
                      className="w-full px-4 py-3 bg-black/50 border border-white/10 rounded-lg text-white placeholder:text-white/40 focus:outline-none focus:border-red-500"
                      placeholder="e.g. Barkeeper"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-white/70 text-sm mb-2">Department</label>
                    <input
                      type="text"
                      value={newJob.department}
                      onChange={(e) => setNewJob({ ...newJob, department: e.target.value })}
                      className="w-full px-4 py-3 bg-black/50 border border-white/10 rounded-lg text-white placeholder:text-white/40 focus:outline-none focus:border-red-500"
                      placeholder="e.g. Bar"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-white/70 text-sm mb-2">Type</label>
                    <select
                      value={newJob.type}
                      onChange={(e) => setNewJob({ ...newJob, type: e.target.value })}
                      className="w-full px-4 py-3 bg-black/50 border border-white/10 rounded-lg text-white focus:outline-none focus:border-red-500"
                    >
                      <option value="Full-time">Full-time</option>
                      <option value="Part-time">Part-time</option>
                      <option value="Freelance">Freelance</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-white/70 text-sm mb-2">Location</label>
                    <input
                      type="text"
                      value={newJob.location}
                      onChange={(e) => setNewJob({ ...newJob, location: e.target.value })}
                      className="w-full px-4 py-3 bg-black/50 border border-white/10 rounded-lg text-white placeholder:text-white/40 focus:outline-none focus:border-red-500"
                      placeholder="e.g. Basel"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-white/70 text-sm mb-2">Description</label>
                    <textarea
                      value={newJob.description}
                      onChange={(e) => setNewJob({ ...newJob, description: e.target.value })}
                      className="w-full px-4 py-3 bg-black/50 border border-white/10 rounded-lg text-white placeholder:text-white/40 focus:outline-none focus:border-red-500 resize-none"
                      placeholder="Job description..."
                      rows={3}
                    />
                  </div>
                  <div>
                    <label className="block text-white/70 text-sm mb-2">Requirements</label>
                    <div className="space-y-2">
                      {newJob.requirements.map((req, index) => (
                        <div key={index} className="flex gap-2">
                          <input
                            type="text"
                            value={req}
                            onChange={(e) => {
                              const newReqs = [...newJob.requirements]
                              newReqs[index] = e.target.value
                              setNewJob({ ...newJob, requirements: newReqs })
                            }}
                            className="flex-1 px-4 py-2 bg-black/50 border border-white/10 rounded-lg text-white placeholder:text-white/40 focus:outline-none focus:border-red-500"
                            placeholder={`Requirement ${index + 1}`}
                          />
                          <button
                            type="button"
                            onClick={() => {
                              const newReqs = newJob.requirements.filter((_, i) => i !== index)
                              setNewJob({ ...newJob, requirements: newReqs })
                            }}
                            className="px-3 py-2 text-red-500 hover:bg-red-500/10 rounded-lg transition-colors"
                          >
                            ✕
                          </button>
                        </div>
                      ))}
                      <button
                        type="button"
                        onClick={() => setNewJob({ ...newJob, requirements: [...newJob.requirements, ''] })}
                        className="w-full px-4 py-2 border border-dashed border-white/20 text-white/60 hover:border-red-500/50 hover:text-red-500 rounded-lg transition-colors"
                      >
                        + Add Requirement
                      </button>
                    </div>
                  </div>
                  <div className="flex gap-3 pt-4">
                    <button
                      type="button"
                      onClick={() => { setShowAddJob(false); setEditingJob(null); }}
                      className="flex-1 px-4 py-3 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="flex-1 px-4 py-3 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors"
                    >
                      Add Job
                    </button>
                  </div>
                </form>
              </motion.div>
            </div>
          )}

          {/* Add Merchandise Modal */}
          {showAddMerch && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-neutral-900 rounded-2xl p-8 max-w-md w-full border border-white/10"
              >
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-white">Add New Product</h2>
                  <button
                    onClick={() => setShowAddMerch(false)}
                    className="p-2 text-white/60 hover:text-white"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>
                <form onSubmit={handleAddMerch} className="space-y-4">
                  <div>
                    <label className="block text-white/70 text-sm mb-2">Product Name</label>
                    <input
                      type="text"
                      value={newMerch.name}
                      onChange={(e) => setNewMerch({ ...newMerch, name: e.target.value })}
                      className="w-full px-4 py-3 bg-black/50 border border-white/10 rounded-lg text-white placeholder:text-white/40 focus:outline-none focus:border-red-500"
                      placeholder="e.g. KINKER Hoodie"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-white/70 text-sm mb-2">Description</label>
                    <textarea
                      value={newMerch.description}
                      onChange={(e) => setNewMerch({ ...newMerch, description: e.target.value })}
                      className="w-full px-4 py-3 bg-black/50 border border-white/10 rounded-lg text-white placeholder:text-white/40 focus:outline-none focus:border-red-500 resize-none"
                      placeholder="Product description..."
                      rows={2}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-white/70 text-sm mb-2">Price (CHF)</label>
                      <input
                        type="number"
                        step="0.01"
                        value={newMerch.price}
                        onChange={(e) => setNewMerch({ ...newMerch, price: e.target.value })}
                        className="w-full px-4 py-3 bg-black/50 border border-white/10 rounded-lg text-white placeholder:text-white/40 focus:outline-none focus:border-red-500"
                        placeholder="49.90"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-white/70 text-sm mb-2">Stock</label>
                      <input
                        type="number"
                        value={newMerch.stock}
                        onChange={(e) => setNewMerch({ ...newMerch, stock: e.target.value })}
                        className="w-full px-4 py-3 bg-black/50 border border-white/10 rounded-lg text-white placeholder:text-white/40 focus:outline-none focus:border-red-500"
                        placeholder="10"
                        required
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-white/70 text-sm mb-2">Category</label>
                    <select
                      value={newMerch.category}
                      onChange={(e) => setNewMerch({ ...newMerch, category: e.target.value })}
                      className="w-full px-4 py-3 bg-black/50 border border-white/10 rounded-lg text-white focus:outline-none focus:border-red-500"
                    >
                      <option value="clothing">Clothing</option>
                      <option value="accessories">Accessories</option>
                      <option value="music">Music</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-white/70 text-sm mb-2">Sizes (comma separated)</label>
                    <input
                      type="text"
                      value={newMerch.sizes.join(', ')}
                      onChange={(e) => setNewMerch({ ...newMerch, sizes: e.target.value.split(',').map(s => s.trim()).filter(Boolean) })}
                      className="w-full px-4 py-3 bg-black/50 border border-white/10 rounded-lg text-white placeholder:text-white/40 focus:outline-none focus:border-red-500"
                      placeholder="S, M, L, XL"
                    />
                  </div>
                  <div>
                    <label className="block text-white/70 text-sm mb-2">Image URL</label>
                    <input
                      type="url"
                      value={newMerch.image}
                      onChange={(e) => setNewMerch({ ...newMerch, image: e.target.value })}
                      className="w-full px-4 py-3 bg-black/50 border border-white/10 rounded-lg text-white placeholder:text-white/40 focus:outline-none focus:border-red-500"
                      placeholder="https://..."
                    />
                  </div>
                  <div className="flex gap-3 pt-4">
                    <button
                      type="button"
                      onClick={() => setShowAddMerch(false)}
                      className="flex-1 px-4 py-3 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="flex-1 px-4 py-3 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors"
                    >
                      Add Product
                    </button>
                  </div>
                </form>
              </motion.div>
            </div>
          )}
        </main>
      </div>
    </div>
  )
}
