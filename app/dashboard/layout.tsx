'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Home, 
  LayoutDashboard, 
  Gift, 
  Briefcase, 
  Package, 
  User, 
  Shield, 
  LogOut,
  Loader2,
  Menu,
  X
} from 'lucide-react'

const menuItems = [
  { id: 'homepage', label: 'Homepage', icon: Home, href: '/' },
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, href: '/dashboard' },
  { id: 'rewards', label: 'Rewards', icon: Gift, href: '/dashboard/rewards' },
  { id: 'careers', label: 'Careers', icon: Briefcase, href: '/dashboard/careers' },
  { id: 'orders', label: 'Orders', icon: Package, href: '/dashboard/orders' },
  { id: 'account', label: 'Account', icon: User, href: '/dashboard/account' },
]

const adminItems = [
  { id: 'admin', label: 'Admin Panel', icon: Shield, href: '/admin' },
]

export default function DashboardLayout({ 
  children 
}: { 
  children: React.ReactNode 
}) {
  const pathname = usePathname()
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isAdmin, setIsAdmin] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(false)

  useEffect(() => {
    checkAuth()
  }, [])

  // Close sidebar when route changes on mobile
  useEffect(() => {
    setSidebarOpen(false)
  }, [pathname])

  const checkAuth = async () => {
    try {
      const res = await fetch('/api/auth/session')
      const data = await res.json()
      
      if (!data.user) {
        router.push('/login?redirect=/dashboard')
        return
      }

      setUser(data.user)
      setIsAdmin(data.user.role === 'admin' || data.user.role === 'staff')
    } catch (err) {
      router.push('/login?redirect=/dashboard')
    } finally {
      setIsLoading(false)
    }
  }

  const handleLogout = async () => {
    await fetch('/api/auth/session', { method: 'DELETE' })
    router.push('/')
    router.refresh()
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-red-500 animate-spin" />
      </div>
    )
  }

  if (!user) {
    return null
  }

  return (
    <div className="min-h-screen bg-black pt-20">
      {/* Mobile Header */}
      <div className="md:hidden fixed top-20 left-0 right-0 z-40 bg-neutral-950 border-b border-white/10 px-3 py-2 flex items-center justify-between">
        <span className="text-white font-medium text-sm">Dashboard</span>
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="p-1.5 text-white/60 hover:text-white"
        >
          {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Mobile Sidebar Overlay */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="md:hidden fixed inset-0 z-50 bg-black/80 backdrop-blur-sm"
            onClick={() => setSidebarOpen(false)}
          />
        )}
      </AnimatePresence>

      <div className="flex">
        {/* Sidebar - Desktop: fixed, Mobile: slide-in overlay */}
        <aside className={`
          fixed z-50 bg-neutral-950 border-r border-white/10 flex flex-col
          transition-transform duration-300 ease-in-out
          md:left-0 md:top-20 md:w-64 md:h-[calc(100vh-5rem)] md:translate-x-0
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
          top-[4.5rem] left-0 w-64 h-[calc(100vh-4.5rem)]
        `}>
          <nav className="p-3 space-y-0.5 flex-1 overflow-y-auto">
            {menuItems.map((item) => {
              const Icon = item.icon
              const isActive = pathname === item.href || pathname?.startsWith(item.href + '/')
              
              return (
                <Link
                  key={item.id}
                  href={item.href}
                  onClick={() => setSidebarOpen(false)}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all text-sm ${
                    isActive 
                      ? 'bg-white/10 text-white' 
                      : 'text-white/60 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span className="font-medium uppercase tracking-wider text-sm">{item.label}</span>
                  {isActive && (
                    <motion.div
                      layoutId="activeIndicator"
                      className="ml-auto w-1 h-1 bg-red-500 rounded-full"
                    />
                  )}
                </Link>
              )
            })}

            {/* Admin Section */}
            {isAdmin && (
              <>
                <div className="pt-6 mt-6 border-t border-white/10">
                  <p className="px-4 text-xs font-semibold text-white/40 uppercase tracking-wider mb-2">
                    Administration
                  </p>
                  {adminItems.map((item) => {
                    const Icon = item.icon
                    return (
                      <Link
                        key={item.id}
                        href={item.href}
                        onClick={() => setSidebarOpen(false)}
                        className="flex items-center gap-3 px-4 py-3 rounded-lg text-white/60 hover:text-white hover:bg-white/5 transition-all"
                      >
                        <Icon className="w-5 h-5" />
                        <span className="font-medium uppercase tracking-wider text-sm">{item.label}</span>
                      </Link>
                    )
                  })}
                </div>
              </>
            )}
          </nav>

          {/* User Profile */}
          <div className="p-3 border-t border-white/10 bg-neutral-950">
            <div className="flex items-center gap-2 px-3 py-2 mb-1">
              <div className="w-8 h-8 bg-red-500 rounded-full flex items-center justify-center">
                <User className="w-4 h-4 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-white font-medium text-sm truncate">{user?.name || 'User'}</p>
                <p className="text-white/40 text-xs truncate">{user?.email}</p>
              </div>
            </div>
            <button 
              onClick={handleLogout}
              className="flex items-center gap-2 px-3 py-2 w-full text-white/60 hover:text-white hover:bg-white/5 rounded-lg transition-all cursor-pointer text-sm"
            >
              <LogOut className="w-4 h-4" />
              <span className="font-medium uppercase tracking-wider">Sign Out</span>
            </button>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 md:ml-64 p-3 md:p-8 min-h-[calc(100vh-5rem)] mt-10 md:mt-0">
          {children}
        </main>
      </div>
    </div>
  )
}
