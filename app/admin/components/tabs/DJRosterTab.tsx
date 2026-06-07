'use client'

import { motion } from 'framer-motion'
import { Mail, Phone, MapPin, DollarSign, Disc, Check, X, Trash2 } from 'lucide-react'

interface DJRosterTabProps {
  djApplications: any[]
  vipBookings: any[]
  djRosterFilter: 'requests' | 'accepted'
  setDJRosterFilter: (f: 'requests' | 'accepted') => void
  updateDJApplicationStatus: (id: string, status: string) => Promise<void>
  deleteDJApplication: (id: string) => Promise<void>
}

export default function DJRosterTab({
  djApplications,
  vipBookings,
  djRosterFilter,
  setDJRosterFilter,
  updateDJApplicationStatus,
  deleteDJApplication
}: DJRosterTabProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-4xl font-bold text-white">DJ Roster</h1>
        <button
          onClick={() => setDJRosterFilter(djRosterFilter === 'requests' ? 'accepted' : 'requests')}
          className={`px-5 py-2.5 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${
            djRosterFilter === 'requests'
              ? 'bg-red-500/20 text-red-500'
              : 'bg-white/5 text-white/60 hover:bg-white/10 hover:text-white'
          }`}
        >
          <Mail className="w-4 h-4" />
          Requests ({djApplications.filter(a => a.status === 'pending').length})
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {djApplications
          .filter(app => djRosterFilter === 'requests' ? app.status === 'pending' : app.status === 'accepted')
          .map((app) => (
          <div
            key={app.id}
            className={`bg-neutral-900/50 rounded-xl overflow-hidden border ${
              app.status === 'pending' ? 'border-red-500/20' : 'border-green-500/20'
            }`}
          >
            {/* Image Header */}
            <div className="aspect-[4/3] bg-neutral-800 relative">
              {app.artist_image ? (
                <img
                  src={app.artist_image}
                  alt={app.artist_name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-neutral-800 to-neutral-900 flex items-center justify-center">
                  <Disc className="w-16 h-16 text-white/20" />
                </div>
              )}
              <div className="absolute top-3 right-3">
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                  app.status === 'pending' ? 'bg-yellow-500/20 text-yellow-500' :
                  app.status === 'accepted' ? 'bg-green-500/20 text-green-500' :
                  'bg-red-500/20 text-red-500'
                }`}>
                  {app.status}
                </span>
              </div>
            </div>

            {/* Content */}
            <div className="p-5 space-y-3">
              <div>
                <h3 className="text-lg font-bold text-white font-display">{app.artist_name}</h3>
                <p className="text-white/50 text-sm">
                  {app.first_name} {app.last_name}
                  {app.age ? ` · ${app.age} years old` : ''}
                </p>
              </div>

              <div className="flex flex-wrap gap-2">
                {app.genre && (
                  <span className="px-2 py-1 bg-white/10 rounded text-xs text-white/70">
                    {app.genre}
                  </span>
                )}
                {app.experience && (
                  <span className="px-2 py-1 bg-white/10 rounded text-xs text-white/70">
                    {app.experience}
                  </span>
                )}
              </div>

              <div className="space-y-1 text-sm text-white/60">
                <p className="flex items-center gap-2">
                  <Mail className="w-4 h-4 text-red-500" />
                  {app.email}
                </p>
                {app.phone && (
                  <p className="flex items-center gap-2">
                    <Phone className="w-4 h-4 text-red-500" />
                    {app.country_code || ''} {app.phone}
                  </p>
                )}
                {(app.city || app.country) && (
                  <p className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-red-500" />
                    {[app.city, app.country].filter(Boolean).join(', ')}
                  </p>
                )}
                {app.standard_gage && (
                  <p className="flex items-center gap-2">
                    <DollarSign className="w-4 h-4 text-red-500" />
                    {app.standard_gage}
                  </p>
                )}
              </div>

              <div className="flex flex-wrap gap-2 pt-2">
                {app.instagram && (
                  <a
                    href={app.instagram.startsWith('http') ? app.instagram : `https://instagram.com/${app.instagram.replace('@', '')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-xs text-white/70 hover:text-white transition-colors"
                  >
                    Instagram
                  </a>
                )}
                {app.soundcloud && (
                  <a
                    href={app.soundcloud.startsWith('http') ? app.soundcloud : `https://${app.soundcloud}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-xs text-white/70 hover:text-white transition-colors"
                  >
                    SoundCloud
                  </a>
                )}
                {app.presskit_url && (
                  <a
                    href={app.presskit_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3 py-1.5 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 rounded-lg text-xs text-red-400 hover:text-red-300 transition-colors"
                  >
                    Presskit
                  </a>
                )}
              </div>

              {/* Actions */}
              {app.status === 'pending' && (
                <div className="flex gap-2 pt-3 border-t border-white/10">
                  <button
                    onClick={() => updateDJApplicationStatus(app.id, 'accepted')}
                    className="flex-1 py-2.5 bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
                  >
                    <Check className="w-4 h-4" />
                    Accept
                  </button>
                  <button
                    onClick={() => updateDJApplicationStatus(app.id, 'denied')}
                    className="flex-1 py-2.5 bg-red-600 hover:bg-red-700 text-white text-sm font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
                  >
                    <X className="w-4 h-4" />
                    Deny
                  </button>
                </div>
              )}

              {app.status !== 'pending' && (
                <div className="flex gap-2 pt-3 border-t border-white/10">
                  <button
                    onClick={() => updateDJApplicationStatus(app.id, 'pending')}
                    className="flex-1 py-2.5 bg-white/10 hover:bg-white/20 text-white text-sm font-medium rounded-lg transition-colors"
                  >
                    Revert to Pending
                  </button>
                  <button
                    onClick={() => deleteDJApplication(app.id)}
                    className="px-3 py-2.5 text-white/60 hover:text-red-500 transition-colors"
                    title="Delete"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              )}

              <p className="text-white/30 text-xs">
                Applied {new Date(app.created_at).toLocaleDateString('en-GB')}
              </p>
            </div>
          </div>
        ))}
      </div>

      {djApplications.filter(a => djRosterFilter === 'requests' ? a.status === 'pending' : a.status === 'accepted').length === 0 && (
        <div className="text-center py-16 text-white/40">
          <Disc className="w-16 h-16 mx-auto mb-4 opacity-50" />
          <p className="text-lg">
            {djRosterFilter === 'requests' ? 'No pending requests' : 'No accepted DJs yet'}
          </p>
        </div>
      )}
    </motion.div>
  )
}
