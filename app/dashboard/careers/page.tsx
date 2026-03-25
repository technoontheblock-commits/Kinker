'use client'

import { useState, useEffect } from 'react'
import { Briefcase, Clock, MapPin, CheckCircle, XCircle, Clock3 } from 'lucide-react'

export default function CareersPage() {
  const [applications, setApplications] = useState<any[]>([])

  useEffect(() => {
    loadApplications()
  }, [])

  const loadApplications = async () => {
    setApplications([
      { id: 1, position: 'Barkeeper', status: 'reviewed', applied: '2024-03-15', department: 'Bar' },
      { id: 2, position: 'Security', status: 'pending', applied: '2024-03-20', department: 'Security' },
    ])
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'hired': return <CheckCircle className="w-5 h-5 text-green-500" />
      case 'rejected': return <XCircle className="w-5 h-5 text-red-500" />
      default: return <Clock3 className="w-5 h-5 text-yellow-500" />
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'hired': return 'Hired'
      case 'rejected': return 'Not selected'
      case 'reviewed': return 'Under review'
      default: return 'Pending'
    }
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">My Applications</h1>
        <p className="text-white/60">Track your job applications</p>
      </div>

      <div className="space-y-4">
        {applications.map((app) => (
          <div key={app.id} className="bg-neutral-900 rounded-xl p-6 border border-white/10">
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-red-500/20 rounded-lg flex items-center justify-center">
                  <Briefcase className="w-6 h-6 text-red-500" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white">{app.position}</h3>
                  <div className="flex items-center gap-4 text-white/60 mt-2">
                    <span className="flex items-center gap-1">
                      <MapPin className="w-4 h-4" />
                      {app.department}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      Applied {new Date(app.applied).toLocaleDateString('de-CH')}
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2 px-4 py-2 bg-black/30 rounded-lg">
                {getStatusIcon(app.status)}
                <span className="text-white font-medium">{getStatusText(app.status)}</span>
              </div>
            </div>
          </div>
        ))}

        {applications.length === 0 && (
          <div className="text-center py-16">
            <Briefcase className="w-16 h-16 text-white/20 mx-auto mb-4" />
            <p className="text-white/40">No applications yet</p>
          </div>
        )}
      </div>

      {/* Open Positions CTA */}
      <div className="bg-gradient-to-r from-red-500/20 to-purple-500/20 rounded-xl p-6 border border-red-500/30">
        <h3 className="text-xl font-bold text-white mb-2">Looking for a job?</h3>
        <p className="text-white/60 mb-4">Join the KINKER team and be part of the underground.</p>
        <a href="/career" className="inline-flex items-center gap-2 px-6 py-3 bg-red-500 hover:bg-red-600 text-white rounded-lg font-medium transition-colors">
          View Open Positions
        </a>
      </div>
    </div>
  )
}
