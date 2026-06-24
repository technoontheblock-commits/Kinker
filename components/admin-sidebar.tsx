'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  Users,
  Bell,
  Briefcase,
  Home,
  Mail,
  CreditCard,
  MessageSquare,
  Crown,
  Layout,
  Disc,
  Code,
  ShoppingBag,
  Package,
  LogOut,
  ScanLine,
  Printer,
  Gift,
  Wine,
  Wallet,
} from 'lucide-react'
import { useAdminTab } from '@/app/admin/components/AdminTabContext'

const tabs = [
  { id: 'dashboard', label: 'Dashboard', icon: Home, href: '/admin' },
  { id: 'users', label: 'User Management', icon: Users, href: '/admin' },
  { id: 'bonuscards', label: 'Memberships', icon: CreditCard, href: '/admin/memberships' },
  { id: 'scanner', label: 'Scanner', icon: ScanLine, href: '/scanner' },
  { id: 'vip-bookings', label: 'VIP Bookings', icon: Crown, href: '/admin/vip-bookings' },
  { id: 'notifications', label: 'Benachrichtigungen', icon: Bell, href: '/admin' },
  { id: 'newsletter', label: 'Newsletter', icon: Mail, href: '/admin/newsletter' },
  { id: 'careers', label: 'Careers', icon: Briefcase, href: '/admin' },
  { id: 'merchandise', label: 'Merch', icon: ShoppingBag, href: '/admin' },
  { id: 'orders', label: 'Bestellungen', icon: Package, href: '/admin' },
  { id: 'bar-products', label: 'Bar Produkte', icon: Wine, href: '/admin/bar-products' },
  { id: 'topup', label: 'Guthaben aufladen', icon: Wallet, href: '/topup' },
  { id: 'forum', label: 'Forum', icon: MessageSquare, href: '/admin/forum' },
  { id: 'board', label: 'Board', icon: Layout, href: '/admin/board' },
  { id: 'advertising', label: 'Werbung', icon: Printer, href: '/admin/advertising' },
  { id: 'dj-roster', label: 'DJ Roster', icon: Disc, href: '/admin' },
  { id: 'developer', label: 'Developer', icon: Code, href: '/admin' },
  { id: 'referrals', label: 'Referrals', icon: Gift, href: '/admin/referrals' },
]

export function AdminSidebar({ onClose }: { onClose?: () => void }) {
  const pathname = usePathname()
  const { activeTab, setActiveTab } = useAdminTab()
  const [unreadCount, setUnreadCount] = useState(0)

  useEffect(() => {
    async function loadNotifications() {
      try {
        const response = await fetch('/api/notifications')
        if (response.ok) {
          const data = await response.json()
          const unread = (data || []).filter((n: any) => !n.read).length
          setUnreadCount(unread)
        }
      } catch {
        // ignore
      }
    }
    loadNotifications()
  }, [])

  const isActive = (tab: typeof tabs[0]) => {
    // External pages: match by pathname
    if (tab.href !== '/admin') {
      return pathname?.startsWith(tab.href)
    }
    // Internal tabs on /admin: match by activeTab context
    return activeTab === tab.id
  }

  const handleClick = (tab: typeof tabs[0]) => {
    // For internal tabs, update the active tab context
    if (tab.href === '/admin') {
      setActiveTab(tab.id)
    }
    onClose?.()
  }

  return (
    <div className="flex flex-col h-full">
      <div className="p-6 flex-1 overflow-y-auto">
        <h2 className="text-xl font-bold text-white mb-8">Admin Panel</h2>
        <nav className="space-y-2">
          {tabs.map((tab) => {
            const Icon = tab.icon
            const active = isActive(tab)

            return (
              <Link
                key={tab.id}
                href={tab.href}
                onClick={() => handleClick(tab)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                  active
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
              </Link>
            )
          })}
        </nav>
      </div>
      <div className="p-6 border-t border-white/10">
        <button
          onClick={async () => {
            await fetch('/api/auth/session', { method: 'DELETE' })
            window.location.href = '/'
          }}
          className="flex items-center gap-3 text-white/70 hover:text-white transition-colors"
        >
          <LogOut className="w-5 h-5" />
          <span>Logout</span>
        </button>
      </div>
    </div>
  )
}
