'use client'

import { motion } from 'framer-motion'
import { Check, Trash2 } from 'lucide-react'

interface NotificationsTabProps {
  notifications: any[]
  markAsRead: (id: string) => Promise<void>
  markAllAsRead: () => Promise<void>
  deleteNotification: (id: string) => Promise<void>
}

export default function NotificationsTab({ notifications, markAsRead, markAllAsRead, deleteNotification }: NotificationsTabProps) {
  return (
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
  )
}
