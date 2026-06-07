'use client'

import { motion } from 'framer-motion'
import { Plus, Briefcase, Calendar, MapPin, Users, Eye, EyeOff, Edit, Trash2, Mail, Phone, FileText, X } from 'lucide-react'

interface CareersTabProps {
  jobs: any[]
  applications: any[]
  showAddJob: boolean
  setShowAddJob: (v: boolean) => void
  editingJob: any
  setEditingJob: (j: any) => void
  newJob: { title: string; department: string; type: string; location: string; description: string; requirements: string[] }
  setNewJob: (j: { title: string; department: string; type: string; location: string; description: string; requirements: string[] }) => void
  selectedJobId: string | null
  setSelectedJobId: (id: string | null) => void
  handleSaveJob: (e: React.FormEvent) => Promise<void>
  toggleJobStatus: (id: string) => Promise<void>
  deleteJob: (id: string) => Promise<void>
  deleteApplication: (id: string) => Promise<void>
  loadApplications: (jobId?: string) => Promise<void>
  updateApplicationStatus: (id: string, status: string) => Promise<void>
}

export default function CareersTab({
  jobs,
  applications,
  showAddJob,
  setShowAddJob,
  editingJob,
  setEditingJob,
  newJob,
  setNewJob,
  selectedJobId,
  setSelectedJobId,
  handleSaveJob,
  toggleJobStatus,
  deleteJob,
  deleteApplication,
  loadApplications,
  updateApplicationStatus
}: CareersTabProps) {
  return (
    <>
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

        <div className="grid gap-6 mb-8">
          {jobs.map((job) => (
            <div key={job.id} className="bg-neutral-900/50 rounded-xl p-6 border border-white/10">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-4 mb-2">
                    <h3 className="text-xl font-bold text-white">{job.title}</h3>
                    <span className={`px-3 py-1 rounded-full text-xs ${
                      job.status === 'active' ? 'bg-green-500/20 text-green-500' : 'bg-white/10 text-white/70'
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
                    <button
                      onClick={() => {
                        setSelectedJobId(selectedJobId === job.id ? null : job.id)
                        if (selectedJobId !== job.id) loadApplications(job.id)
                      }}
                      className="flex items-center gap-2 text-red-500 hover:text-red-400 transition-colors"
                    >
                      <Users className="w-4 h-4" />
                      {job.applicants} Applicants
                      {selectedJobId === job.id ? ' ▲' : ' ▼'}
                    </button>
                  </div>

                  {/* Applications for this job */}
                  {selectedJobId === job.id && (
                    <div className="mt-4 border-t border-white/10 pt-4">
                      <h4 className="text-white font-semibold mb-3">Bewerbungen für {job.title}</h4>
                      <div className="space-y-3">
                        {applications.filter(a => a.job_id === job.id).map((app) => (
                          <div
                            key={app.id}
                            className={`p-4 rounded-lg border ${app.status === 'new' ? 'bg-red-500/5 border-red-500/20' : 'bg-black/30 border-white/10'}`}
                          >
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <div className="flex items-center gap-3 mb-2">
                                  <span className="font-semibold text-white">{app.name}</span>
                                  <span className={`px-2 py-0.5 rounded-full text-xs ${
                                    app.status === 'new' ? 'bg-red-500/20 text-red-500' :
                                    app.status === 'reviewed' ? 'bg-yellow-500/20 text-yellow-500' :
                                    app.status === 'interview' ? 'bg-blue-500/20 text-blue-500' :
                                    app.status === 'hired' ? 'bg-green-500/20 text-green-500' :
                                    'bg-white/10 text-white/60'
                                  }`}>
                                    {app.status === 'new' ? 'Neu' :
                                     app.status === 'reviewed' ? 'Geprüft' :
                                     app.status === 'interview' ? 'Interview' :
                                     app.status === 'hired' ? 'Eingestellt' : 'Abgelehnt'}
                                  </span>
                                </div>
                                <div className="flex flex-wrap items-center gap-4 text-sm text-white/60 mb-2">
                                  <span className="flex items-center gap-1">
                                    <Mail className="w-3 h-3 text-red-500" />
                                    {app.email}
                                  </span>
                                  {app.phone && (
                                    <span className="flex items-center gap-1">
                                      <Phone className="w-3 h-3 text-red-500" />
                                      {app.phone}
                                    </span>
                                  )}
                                  <span className="text-white/40">
                                    {new Date(app.created_at).toLocaleDateString('de-CH')}
                                  </span>
                                </div>
                                {app.message && (
                                  <p className="text-white/60 text-sm bg-black/30 p-2 rounded mt-2">
                                    {app.message}
                                  </p>
                                )}
                                {app.cv_url && (
                                  <a
                                    href={app.cv_url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-1 text-red-500 hover:text-red-400 text-sm mt-2"
                                  >
                                    <FileText className="w-4 h-4" />
                                    Lebenslauf ansehen
                                  </a>
                                )}
                              </div>
                              <div className="flex items-center gap-1 ml-4">
                                <select
                                  value={app.status}
                                  onChange={(e) => updateApplicationStatus(app.id, e.target.value)}
                                  className="px-2 py-1 bg-black border border-white/20 rounded text-sm text-white"
                                >
                                  <option value="new">Neu</option>
                                  <option value="reviewed">Geprüft</option>
                                  <option value="interview">Interview</option>
                                  <option value="hired">Eingestellt</option>
                                  <option value="rejected">Abgelehnt</option>
                                </select>
                                <button
                                  onClick={() => deleteApplication(app.id)}
                                  className="p-2 text-white/40 hover:text-red-500 transition-colors"
                                  title="Löschen"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </div>
                          </div>
                        ))}
                        {applications.filter(a => a.job_id === job.id).length === 0 && (
                          <p className="text-white/40 text-sm italic">Keine Bewerbungen für diese Position</p>
                        )}
                      </div>
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => toggleJobStatus(job.id)}
                    className="p-2 text-white/60 hover:text-white transition-colors"
                    title={job.status === 'active' ? 'Deactivate' : 'Activate'}
                  >
                    {job.status === 'active' ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                  <button
                    onClick={() => {
                      setEditingJob(job)
                      setNewJob({
                        title: job.title,
                        department: job.department,
                        type: job.type,
                        location: job.location,
                        description: job.description || '',
                        requirements: job.requirements || []
                      })
                    }}
                    className="p-2 text-white/60 hover:text-white transition-colors"
                    title="Edit"
                  >
                    <Edit className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => deleteJob(job.id)}
                    className="p-2 text-white/60 hover:text-red-500 transition-colors"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Add Job Modal */}
      {(showAddJob || editingJob) && (
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
            <form onSubmit={handleSaveJob} className="space-y-4">
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
              <div>
                <label className="block text-white/70 text-sm mb-2">Requirements</label>
                <div className="space-y-2">
                  {newJob.requirements.map((req, index) => (
                    <div key={index} className="flex gap-2">
                      <input
                        type="text"
                        value={req}
                        onChange={(e) => {
                          const newReqs = [...newJob.requirements]
                          newReqs[index] = e.target.value
                          setNewJob({ ...newJob, requirements: newReqs })
                        }}
                        className="flex-1 px-4 py-2 bg-black/50 border border-white/10 rounded-lg text-white placeholder:text-white/40 focus:outline-none focus:border-red-500"
                        placeholder={`Requirement ${index + 1}`}
                      />
                      <button
                        type="button"
                        onClick={() => {
                          const newReqs = newJob.requirements.filter((_, i) => i !== index)
                          setNewJob({ ...newJob, requirements: newReqs })
                        }}
                        className="px-3 py-2 text-red-500 hover:bg-red-500/10 rounded-lg transition-colors"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={() => setNewJob({ ...newJob, requirements: [...newJob.requirements, ''] })}
                    className="w-full px-4 py-2 border border-dashed border-white/20 text-white/60 hover:border-red-500/50 hover:text-red-500 rounded-lg transition-colors"
                  >
                    + Add Requirement
                  </button>
                </div>
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => { setShowAddJob(false); setEditingJob(null); }}
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
    </>
  )
}
