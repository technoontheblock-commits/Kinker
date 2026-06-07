'use client'

import { useState, useEffect } from 'react'
import { getEvents } from '@/lib/events'
import { Suspense } from 'react'
import dynamic from 'next/dynamic'

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
  const [vipBookings, setVipBookings] = useState<any[]>([])
  const [djApplications, setDJApplications] = useState<any[]>([])
  const [showAddUser, setShowAddUser] = useState(false)
  const [editingUser, setEditingUser] = useState<any>(null)
  const [showAddJob, setShowAddJob] = useState(false)
  const [editingJob, setEditingJob] = useState<any>(null)
  const [showAddEvent, setShowAddEvent] = useState(false)
  const [editingEvent, setEditingEvent] = useState<any>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [djRosterFilter, setDJRosterFilter] = useState<'requests' | 'accepted'>('accepted')
  const [testEmail, setTestEmail] = useState('')
  const [testEmailLoading, setTestEmailLoading] = useState(false)
  const [testEmailResult, setTestEmailResult] = useState<{ success?: boolean; message?: string; code?: string } | null>(null)
  const [printfulProducts, setPrintfulProducts] = useState<any[]>([])
  const [printfulOrders, setPrintfulOrders] = useState<any[]>([])
  const [printfulLoading, setPrintfulLoading] = useState(false)
  const [printfulError, setPrintfulError] = useState('')
  
  // New user form state
  const [newUser, setNewUser] = useState({
    name: '',
    email: '',
    role: 'user'
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
  const [isLoading, setIsLoading] = useState(true)
  const [loadedTabs, setLoadedTabs] = useState<Set<string>>(new Set(['dashboard']))

  // Load dashboard data immediately
  useEffect(() => {
    const loadDashboardData = async () => {
      await Promise.all([
        loadEvents(),
        loadUsers(),
        loadNotifications()
      ])
      setIsLoading(false)
    }
    loadDashboardData()
  }, [])

  // Lazy-load tab-specific data on first visit
  useEffect(() => {
    if (loadedTabs.has(activeTab)) return

    const loadTabData = async () => {
      switch (activeTab) {
        case 'careers':
          await Promise.all([loadJobs(), loadApplications()])
          break
        case 'merchandise':
          await loadMerchandise()
          break
        case 'orders':
          await loadOrders()
          break
        case 'tickets':
          await loadTickets()
          break
        case 'dj-roster':
          await Promise.all([loadDJApplications(), loadVIPBookings()])
          break
        case 'developer':
          await loadPrintfulData()
          break
        case 'rental':
          await loadRentalInquiries()
          break
        case 'users':
          await loadUsers()
          break
        case 'notifications':
          await loadNotifications()
          break
      }
      setLoadedTabs(prev => new Set(prev).add(activeTab))
    }

    loadTabData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab])

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
        setOrders(data.orders || [])
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

  // Load VIP bookings
  const loadVIPBookings = async () => {
    try {
      const response = await fetch('/api/vip-bookings')
      if (response.ok) {
        const data = await response.json()
        setVipBookings(data || [])
      }
    } catch (error) {
      console.error('Error loading VIP bookings:', error)
    }
  }

  // Load DJ applications
  const loadDJApplications = async () => {
    try {
      const response = await fetch('/api/dj-roster')
      if (response.ok) {
        const data = await response.json()
        setDJApplications(data || [])
      }
    } catch (error) {
      console.error('Error loading DJ applications:', error)
    }
  }

  const updateDJApplicationStatus = async (id: string, status: string) => {
    try {
      const response = await fetch(`/api/dj-roster/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      })
      if (response.ok) {
        setDJApplications(djApplications.map(a => a.id === id ? { ...a, status } : a))
      }
    } catch (error) {
      console.error('Error updating DJ application status:', error)
    }
  }

  const deleteDJApplication = async (id: string) => {
    if (!confirm('Are you sure you want to delete this DJ application?')) return
    try {
      const response = await fetch(`/api/dj-roster/${id}`, { method: 'DELETE' })
      if (response.ok) {
        setDJApplications(djApplications.filter(a => a.id !== id))
      }
    } catch (error) {
      console.error('Error deleting DJ application:', error)
    }
  }

  const loadPrintfulData = async () => {
    try {
      const [productsRes, ordersRes] = await Promise.all([
        fetch('/api/printful/products'),
        fetch('/api/printful/orders')
      ])
      if (productsRes.ok) {
        const data = await productsRes.json()
        setPrintfulProducts(data || [])
      }
      if (ordersRes.ok) {
        const data = await ordersRes.json()
        setPrintfulOrders(data || [])
      }
    } catch (error) {
      console.error('Error loading Printful data:', error)
    }
  }

  const syncPrintfulProducts = async () => {
    setPrintfulLoading(true)
    setPrintfulError('')
    try {
      const res = await fetch('/api/printful/sync', { method: 'POST' })
      const data = await res.json()
      if (res.ok) {
        await loadPrintfulData()
      } else {
        setPrintfulError(data.error || 'Sync failed')
      }
    } catch (error: any) {
      console.error('Error syncing Printful:', error)
      setPrintfulError(error.message || 'Network error')
    } finally {
      setPrintfulLoading(false)
    }
  }

  // Send test verification email
  const sendTestVerificationEmail = async () => {
    if (!testEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(testEmail)) {
      setTestEmailResult({ success: false, message: 'Please enter a valid email address' })
      return
    }
    setTestEmailLoading(true)
    setTestEmailResult(null)
    try {
      const res = await fetch('/api/email/test-verification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: testEmail })
      })
      const data = await res.json()
      if (res.ok) {
        setTestEmailResult({ success: true, message: 'Test email sent successfully!', code: data.code })
      } else {
        setTestEmailResult({ success: false, message: data.error || 'Failed to send' })
      }
    } catch (error: any) {
      setTestEmailResult({ success: false, message: error.message || 'Network error' })
    } finally {
      setTestEmailLoading(false)
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
        setNewUser({ name: '', email: '', role: 'user' })
      } else {
        const error = await response.json()
        alert('Error adding user: ' + (error.error || 'Unknown error'))
      }
    } catch (error) {
      console.error('Error adding user:', error)
      alert('Error adding user')
    }
  }

  const handleUpdateUser = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingUser) return
    
    try {
      const response = await fetch(`/api/users/${editingUser.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: editingUser.name,
          email: editingUser.email,
          role: editingUser.role
        })
      })
      
      if (response.ok) {
        await loadUsers()
        setEditingUser(null)
      } else {
        const error = await response.json()
        alert('Error updating user: ' + (error.error || 'Unknown error'))
      }
    } catch (error) {
      console.error('Error updating user:', error)
      alert('Error updating user')
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
        } else {
          const data = await response.json().catch(() => ({}))
          alert('Error deleting event: ' + (data.error || `HTTP ${response.status}`))
        }
      } catch (error) {
        console.error('Error deleting event:', error)
        alert('Network error deleting event')
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

  // Show loading state while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-2 border-red-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-white/60">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black pt-20">
      <main className="p-4 md:p-8">
        {activeTab === 'dashboard' && (
          <Suspense fallback={<div className="text-white/60">Loading...</div>}>
            <DashboardTab users={users} unreadCount={unreadCount} jobs={jobs} events={events} notifications={notifications} vipBookings={vipBookings} />
          </Suspense>
        )}
        {activeTab === 'users' && (
          <Suspense fallback={<div className="text-white/60">Loading...</div>}>
            <UsersTab
              users={users}
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
              showAddUser={showAddUser}
              setShowAddUser={setShowAddUser}
              editingUser={editingUser}
              setEditingUser={setEditingUser}
              newUser={newUser}
              setNewUser={setNewUser}
              handleAddUser={handleAddUser}
              handleUpdateUser={handleUpdateUser}
              deleteUser={deleteUser}
            />
          </Suspense>
        )}
        {activeTab === 'rental' && (
          <Suspense fallback={<div className="text-white/60">Loading...</div>}>
            <RentalTab rentalInquiries={rentalInquiries} updateRentalStatus={updateRentalStatus} deleteRentalInquiry={deleteRentalInquiry} />
          </Suspense>
        )}
        {activeTab === 'notifications' && (
          <Suspense fallback={<div className="text-white/60">Loading...</div>}>
            <NotificationsTab notifications={notifications} markAsRead={markAsRead} markAllAsRead={markAllAsRead} deleteNotification={deleteNotification} />
          </Suspense>
        )}
        {activeTab === 'events' && (
          <Suspense fallback={<div className="text-white/60">Loading...</div>}>
            <EventsTab
              events={events}
              showAddEvent={showAddEvent}
              setShowAddEvent={setShowAddEvent}
              editingEvent={editingEvent}
              setEditingEvent={setEditingEvent}
              handleEditEvent={handleEditEvent}
              handleDeleteEvent={handleDeleteEvent}
              loadEvents={loadEvents}
            />
          </Suspense>
        )}
        {activeTab === 'careers' && (
          <Suspense fallback={<div className="text-white/60">Loading...</div>}>
            <CareersTab
              jobs={jobs}
              applications={applications}
              showAddJob={showAddJob}
              setShowAddJob={setShowAddJob}
              editingJob={editingJob}
              setEditingJob={setEditingJob}
              newJob={newJob}
              setNewJob={setNewJob}
              selectedJobId={selectedJobId}
              setSelectedJobId={setSelectedJobId}
              handleSaveJob={handleSaveJob}
              toggleJobStatus={toggleJobStatus}
              deleteJob={deleteJob}
              deleteApplication={deleteApplication}
              loadApplications={loadApplications}
              updateApplicationStatus={updateApplicationStatus}
            />
          </Suspense>
        )}
        {activeTab === 'merchandise' && (
          <Suspense fallback={<div className="text-white/60">Loading...</div>}>
            <MerchandiseTab
              merchandise={merchandise}
              showAddMerch={showAddMerch}
              setShowAddMerch={setShowAddMerch}
              editingMerch={editingMerch}
              setEditingMerch={setEditingMerch}
              newMerch={newMerch}
              setNewMerch={setNewMerch}
              handleAddMerch={handleAddMerch}
              toggleMerchStatus={toggleMerchStatus}
              deleteMerch={deleteMerch}
            />
          </Suspense>
        )}
        {activeTab === 'orders' && (
          <Suspense fallback={<div className="text-white/60">Loading...</div>}>
            <OrdersTab
              orders={orders}
              orderFilter={orderFilter}
              setOrderFilter={setOrderFilter}
              selectedOrder={selectedOrder}
              setSelectedOrder={setSelectedOrder}
              updateOrderStatus={updateOrderStatus}
            />
          </Suspense>
        )}
        {activeTab === 'tickets' && (
          <Suspense fallback={<div className="text-white/60">Loading...</div>}>
            <TicketsTab
              tickets={tickets}
              ticketFilter={ticketFilter}
              setTicketFilter={setTicketFilter}
              selectedTicket={selectedTicket}
              setSelectedTicket={setSelectedTicket}
              cancelTicket={cancelTicket}
              loadTickets={loadTickets}
            />
          </Suspense>
        )}
        {activeTab === 'dj-roster' && (
          <Suspense fallback={<div className="text-white/60">Loading...</div>}>
            <DJRosterTab
              djApplications={djApplications}
              vipBookings={vipBookings}
              djRosterFilter={djRosterFilter}
              setDJRosterFilter={setDJRosterFilter}
              updateDJApplicationStatus={updateDJApplicationStatus}
              deleteDJApplication={deleteDJApplication}
            />
          </Suspense>
        )}
        {activeTab === 'printful' && (
          <Suspense fallback={<div className="text-white/60">Loading...</div>}>
            <PrintfulTab
              printfulProducts={printfulProducts}
              printfulOrders={printfulOrders}
              printfulLoading={printfulLoading}
              printfulError={printfulError}
              syncPrintfulProducts={syncPrintfulProducts}
            />
          </Suspense>
        )}
        {activeTab === 'developer' && (
          <Suspense fallback={<div className="text-white/60">Loading...</div>}>
            <DeveloperTab
              testEmail={testEmail}
              setTestEmail={setTestEmail}
              testEmailLoading={testEmailLoading}
              setTestEmailLoading={setTestEmailLoading}
              testEmailResult={testEmailResult}
              setTestEmailResult={setTestEmailResult}
              sendTestVerificationEmail={sendTestVerificationEmail}
              setActiveTab={setActiveTab}
            />
          </Suspense>
        )}
      </main>
    </div>
  )
}

const DashboardTab = dynamic(() => import('./components/tabs/DashboardTab'))
const UsersTab = dynamic(() => import('./components/tabs/UsersTab'))
const RentalTab = dynamic(() => import('./components/tabs/RentalTab'))
const NotificationsTab = dynamic(() => import('./components/tabs/NotificationsTab'))
const EventsTab = dynamic(() => import('./components/tabs/EventsTab'))
const CareersTab = dynamic(() => import('./components/tabs/CareersTab'))
const MerchandiseTab = dynamic(() => import('./components/tabs/MerchandiseTab'))
const OrdersTab = dynamic(() => import('./components/tabs/OrdersTab'))
const TicketsTab = dynamic(() => import('./components/tabs/TicketsTab'))
const DJRosterTab = dynamic(() => import('./components/tabs/DJRosterTab'))
const PrintfulTab = dynamic(() => import('./components/tabs/PrintfulTab'))
const DeveloperTab = dynamic(() => import('./components/tabs/DeveloperTab'))
