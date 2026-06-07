'use client'

import { motion } from 'framer-motion'
import { Building, Mail, Phone, Calendar, Users, Trash2 } from 'lucide-react'

interface RentalTabProps {
  rentalInquiries: any[]
  updateRentalStatus: (id: string, status: string) => Promise<void>
  deleteRentalInquiry: (id: string) => Promise<void>
}

export default function RentalTab({ rentalInquiries, updateRentalStatus, deleteRentalInquiry }: RentalTabProps) {
  return (
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
  )
}
