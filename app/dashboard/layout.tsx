'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { 
  Home, 
  LayoutDashboard, 
  Gift, 
  Briefcase, 
  Package, 
  User, 
  Shield, 
  LogOut,
  Ticket,
  Loader2
} from 'lucide-react'

const menuItems = [
  { id: 'homepage', label: 'Homepage', icon: Home, href: '/' },
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, href: '/dashboard' },
  { id: 'rewards', label: 'Rewards', icon: Gift, href: '/dashboard/rewards' },
  { id: 'careers', label: 'Careers', icon: Briefcase, href: '/dashboard/careers' },
  { id: 'orders', label: 'Orders', icon: Package, href: '/dashboard/orders' },
  { id: 'tickets', label: 'My Tickets', icon: Ticket, href: '/dashboard/tickets' },
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

  useEffect(() => {
    checkAuth()
  }, [])

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
      <div className="flex">
        {/* Sidebar */}
        <aside className="w-64 bg-neutral-950 min-h-screen fixed left-0 top-20 border-r border-white/10">
          <nav className="p-4 space-y-1">
            {menuItems.map((item) => {
              const Icon = item.icon
              const isActive = pathname === item.href || pathname?.startsWith(item.href + '/')
              
              return (
                <Link
                  key={item.id}
                  href={item.href}
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
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
          <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-white/10">
            <div className="flex items-center gap-3 px-4 py-3 mb-2">
              <div className="w-10 h-10 bg-red-500 rounded-full flex items-center justify-center">
                <User className="w-5 h-5 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-white font-medium truncate">{user?.name || 'User'}</p>
                <p className="text-white/40 text-sm truncate">{user?.email}</p>
              </div>
            </div>
            <button 
              onClick={handleLogout}
              className="flex items-center gap-3 px-4 py-3 w-full text-white/60 hover:text-white hover:bg-white/5 rounded-lg transition-all"
            >
              <LogOut className="w-5 h-5" />
              <span className="font-medium uppercase tracking-wider text-sm">Sign Out</span>
            </button>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 ml-64 p-8">
          {children}
        </main>
      </div>
    </div>
  )
}
