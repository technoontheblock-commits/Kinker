'use client'

import { useState, useEffect } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { Menu, X, Loader2 } from 'lucide-react'
import { AdminSidebar } from '@/components/admin-sidebar'
import { AdminTabProvider } from './components/AdminTabContext'

export default function AdminLayout({ 
  children 
}: { 
  children: React.ReactNode 
}) {
  const pathname = usePathname()
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(true)
  const [sidebarOpen, setSidebarOpen] = useState(false)

  useEffect(() => {
    setSidebarOpen(false)
  }, [pathname])

  useEffect(() => {
    checkAuth()
  }, [])

  const checkAuth = async () => {
    try {
      const res = await fetch('/api/auth/session')
      const data = await res.json()
      
      if (!data.user) {
        router.push('/login?redirect=/admin')
        return
      }
      
      if (data.user.role !== 'admin') {
        router.push('/')
        return
      }
    } catch (err) {
      router.push('/login?redirect=/admin')
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-red-500 animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black">
      {/* Mobile Header */}
      <div className="md:hidden fixed top-20 left-0 right-0 z-40 bg-neutral-950 border-b border-white/10 px-3 py-2 flex items-center justify-between">
        <span className="text-white font-medium text-sm">Admin</span>
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

      <AdminTabProvider>
        <div className="flex">
          {/* Sidebar - Desktop: fixed, Mobile: slide-in overlay */}
          <aside className={`
            fixed z-50 bg-neutral-900 border-r border-white/10 flex flex-col
            transition-transform duration-300 ease-in-out
            md:left-0 md:top-20 md:w-64 md:h-[calc(100vh-5rem)] md:translate-x-0
            ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
            top-[4.5rem] left-0 w-64 h-[calc(100vh-4.5rem)]
          `}>
            <AdminSidebar onClose={() => setSidebarOpen(false)} />
          </aside>

          {/* Main Content */}
          <main className="flex-1 md:ml-64 mt-10 md:mt-0 p-4 md:p-8 min-h-screen">
            {children}
          </main>
        </div>
      </AdminTabProvider>
    </div>
  )
}
