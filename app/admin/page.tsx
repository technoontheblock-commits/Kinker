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
  LogOut
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

const mockNotifications = [
  { id: 1, type: 'booking', title: 'Neue Raumanfrage', message: 'Neue Anfrage für Wohnzimmer am 15.04.2024', date: '2024-03-22 14:30', read: false },
  { id: 2, type: 'contact', title: 'Kontaktformular', message: 'Neue Nachricht von max@example.com', date: '2024-03-22 12:15', read: false },
  { id: 3, type: 'career', title: 'Neue Bewerbung', message: 'Bewerbung als Barkeeper eingegangen', date: '2024-03-21 18:45', read: true },
  { id: 4, type: 'system', title: 'System Update', message: 'System erfolgreich aktualisiert', date: '2024-03-20 03:00', read: true },
]

const mockJobs = [
  { id: 1, title: 'Barkeeper', department: 'Bar', type: 'Part-time', location: 'Basel', status: 'Active', applicants: 5 },
  { id: 2, title: 'Security', department: 'Security', type: 'Part-time', location: 'Basel', status: 'Active', applicants: 3 },
  { id: 3, title: 'Lichttechniker', department: 'Technik', type: 'Freelance', location: 'Basel', status: 'Inactive', applicants: 0 },
]

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState('dashboard')
  const [users, setUsers] = useState<any[]>([])
  const [notifications, setNotifications] = useState(mockNotifications)
  const [jobs, setJobs] = useState(mockJobs)
  const [events, setEvents] = useState<any[]>([])
  const [showAddUser, setShowAddUser] = useState(false)
  const [showAddJob, setShowAddJob] = useState(false)
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
    description: ''
  })

  useEffect(() => {
    loadEvents()
    loadUsers()
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
    { id: 'users', label: 'User Management', icon: Users },
    { id: 'notifications', label: 'Benachrichtigungen', icon: Bell },
    { id: 'careers', label: 'Careers', icon: Briefcase },
  ]

  const unreadCount = notifications.filter(n => !n.read).length

  const markAsRead = (id: number) => {
    setNotifications(notifications.map(n => n.id === id ? { ...n, read: true } : n))
  }

  const deleteNotification = (id: number) => {
    setNotifications(notifications.filter(n => n.id !== id))
  }

  const toggleJobStatus = (id: number) => {
    setJobs(jobs.map(j => j.id === id ? { ...j, status: j.status === 'Active' ? 'Inactive' : 'Active' } : j))
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

  const handleAddJob = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const jobToAdd = {
        ...newJob,
        id: jobs.length + 1,
        status: 'Active',
        applicants: 0
      }
      setJobs([...jobs, jobToAdd])
      setShowAddJob(false)
      setNewJob({ title: '', department: '', type: 'Full-time', location: 'Basel', description: '' })
    } catch (error) {
      console.error('Error adding job:', error)
      alert('Error adding job')
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

          {/* Notifications */}
          {activeTab === 'notifications' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <div className="flex items-center justify-between mb-8">
                <h1 className="text-4xl font-bold text-white">Benachrichtigungszentrum</h1>
                <button
                  onClick={() => setNotifications(notifications.map(n => ({ ...n, read: true })))}
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
                          <p className="text-white/40 text-sm mt-2">{notif.date}</p>
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

              <div className="grid gap-6">
                {jobs.map((job) => (
                  <div key={job.id} className="bg-neutral-900/50 rounded-xl p-6 border border-white/10">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-4 mb-2">
                          <h3 className="text-xl font-bold text-white">{job.title}</h3>
                          <span className={`px-3 py-1 rounded-full text-xs ${
                            job.status === 'Active' ? 'bg-green-500/20 text-green-500' : 'bg-white/10 text-white/70'
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
                          <span className="flex items-center gap-2">
                            <Users className="w-4 h-4" />
                            {job.applicants} Applicants
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => toggleJobStatus(job.id)}
                          className="p-2 text-white/60 hover:text-white transition-colors"
                          title={job.status === 'Active' ? 'Deactivate' : 'Activate'}
                        >
                          {job.status === 'Active' ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                        </button>
                        <button className="p-2 text-white/60 hover:text-white transition-colors">
                          <Edit className="w-5 h-5" />
                        </button>
                        <button className="p-2 text-white/60 hover:text-red-500 transition-colors">
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
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
          {showAddJob && (
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
                <form onSubmit={handleAddJob} className="space-y-4">
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
                  <div className="flex gap-3 pt-4">
                    <button
                      type="button"
                      onClick={() => setShowAddJob(false)}
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
        </main>
      </div>
    </div>
  )
}
