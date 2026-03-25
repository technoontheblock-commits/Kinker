'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { 
  Briefcase, 
  MapPin, 
  Clock, 
  CheckCircle2, 
  Send,
  Sparkles,
  Clock3,
  PartyPopper,
  GraduationCap,
  Users,
  Coffee,
  Loader2
} from 'lucide-react'
import { useLanguage } from '@/components/language-provider'

const benefitIcons = [
  { icon: <Sparkles className="w-6 h-6" /> },
  { icon: <Clock3 className="w-6 h-6" /> },
  { icon: <PartyPopper className="w-6 h-6" /> },
  { icon: <GraduationCap className="w-6 h-6" /> },
  { icon: <Users className="w-6 h-6" /> },
  { icon: <Coffee className="w-6 h-6" /> },
]

interface Job {
  id: string
  title: string
  department: string
  type: string
  location: string
  description: string
  requirements: string[]
  status: string
}

export default function CareerPage() {
  const { t, language } = useLanguage()
  const [jobs, setJobs] = useState<Job[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedJob, setSelectedJob] = useState<Job | null>(null)
  const [showApplication, setShowApplication] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    message: ''
  })
  const [cvFile, setCvFile] = useState<File | null>(null)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    loadJobs()
  }, [])

  const loadJobs = async () => {
    try {
      const response = await fetch('/api/jobs')
      if (response.ok) {
        const data = await response.json()
        // Filter only active jobs
        setJobs((data || []).filter((job: Job) => job.status === 'active'))
      }
    } catch (error) {
      console.error('Error loading jobs:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleApply = (job: Job) => {
    setSelectedJob(job)
    setShowApplication(true)
    // Reset form
    setFormData({ name: '', email: '', phone: '', message: '' })
    setCvFile(null)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedJob) return
    
    setSubmitting(true)
    try {
      const submitData = new FormData()
      submitData.append('jobId', selectedJob.id)
      submitData.append('name', formData.name)
      submitData.append('email', formData.email)
      submitData.append('phone', formData.phone)
      submitData.append('message', formData.message)
      if (cvFile) {
        submitData.append('cv', cvFile)
      }

      const response = await fetch('/api/applications', {
        method: 'POST',
        body: submitData
      })
      
      if (response.ok) {
        setSubmitted(true)
      } else {
        const error = await response.json()
        alert('Error submitting application: ' + (error.error || 'Unknown error'))
      }
    } catch (error) {
      console.error('Error submitting application:', error)
      alert('Error submitting application')
    } finally {
      setSubmitting(false)
    }
  }

  const benefits = language === 'DE' 
    ? ['Attraktive Vergütung', 'Flexibles Arbeiten', 'Kreatives Umfeld', 'Weiterbildung', 'Team-Events', 'Kostenlose Getränke']
    : ['Attractive Salary', 'Flexible Working', 'Creative Environment', 'Further Education', 'Team Events', 'Free Drinks']

  if (submitted) {
    return (
      <div className="min-h-screen bg-black pt-24 lg:pt-32 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center px-4"
        >
          <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 className="w-10 h-10 text-green-500" />
          </div>
          <h2 className="text-4xl font-bold text-white mb-4 font-display">{t.career.success.title}</h2>
          <p className="text-white/70 text-lg max-w-md mx-auto">
            {t.career.success.message}
          </p>
        </motion.div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-black pt-24 lg:pt-32 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-red-500 animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black pt-24 lg:pt-32">
      {/* Hero Section */}
      <section className="container mx-auto px-4 sm:px-6 lg:px-8 mb-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="max-w-3xl"
        >
          <span className="text-red-500 font-semibold tracking-widest uppercase text-sm mb-4 block">
            {t.career.subtitle}
          </span>
          <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold tracking-tighter font-display text-white mb-6">
            {t.career.title.split(' ').slice(0, -2).join(' ')}<br />
            <span className="text-red-500">{t.career.title.split(' ').slice(-2).join(' ')}</span>
          </h1>
          <p className="text-lg text-white/70 leading-relaxed">
            {t.career.description}
          </p>
        </motion.div>
      </section>

      {/* Benefits */}
      <section className="container mx-auto px-4 sm:px-6 lg:px-8 mb-24">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.6 }}
        >
          <h2 className="text-3xl font-bold text-white mb-12 font-display text-center">
            {t.career.benefits}
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
            {benefits.map((benefit, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: index * 0.1 }}
                className="bg-neutral-900/50 rounded-xl p-6 border border-white/10 text-center hover:border-red-500/50 transition-colors"
              >
                <div className="text-red-500 mb-4 flex justify-center">{benefitIcons[index].icon}</div>
                <p className="text-white/80 text-sm">{benefit}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </section>

      {/* Job Listings */}
      <section className="container mx-auto px-4 sm:px-6 lg:px-8 pb-24">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.6 }}
        >
          <h2 className="text-3xl font-bold text-white mb-12 font-display">
            {t.career.openPositions}
          </h2>

          <div className="grid gap-6">
            {jobs.map((job, index) => (
              <motion.div
                key={job.id}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: index * 0.1 }}
                className="bg-neutral-900/50 rounded-2xl p-8 border border-white/10 hover:border-red-500/50 transition-colors"
              >
                <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
                  <div className="flex-1">
                    <div className="flex items-center gap-4 mb-4">
                      <Briefcase className="w-6 h-6 text-red-500" />
                      <h3 className="text-2xl font-bold text-white font-display">{job.title}</h3>
                      <span className="px-3 py-1 bg-red-500/20 text-red-500 rounded-full text-xs font-medium">
                        {job.type}
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-6 text-white/60 text-sm mb-4">
                      <span className="flex items-center gap-2">
                        <Briefcase className="w-4 h-4" />
                        {job.department}
                      </span>
                      <span className="flex items-center gap-2">
                        <MapPin className="w-4 h-4" />
                        {job.location}
                      </span>
                      <span className="flex items-center gap-2">
                        <Clock className="w-4 h-4" />
                        {job.type}
                      </span>
                    </div>

                    <p className="text-white/70 mb-6">{job.description}</p>

                    {job.requirements && job.requirements.length > 0 && (
                      <div className="space-y-3">
                        <h4 className="text-white font-semibold text-sm">
                          {language === 'DE' ? 'Anforderungen:' : 'Requirements:'}
                        </h4>
                        <ul className="space-y-2">
                          {job.requirements.map((req, i) => (
                            <li key={i} className="flex items-start gap-3 text-white/60 text-sm">
                              <CheckCircle2 className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
                              <span>{req}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>

                  <button
                    onClick={() => handleApply(job)}
                    className="px-6 py-3 bg-red-500 hover:bg-red-600 text-white font-semibold rounded-lg transition-colors whitespace-nowrap flex items-center gap-2"
                  >
                    <Send className="w-4 h-4" />
                    {t.career.applyNow}
                  </button>
                </div>
              </motion.div>
            ))}
          </div>

          {/* No Jobs Message */}
          {jobs.length === 0 && (
            <div className="text-center py-16">
              <Briefcase className="w-16 h-16 text-white/20 mx-auto mb-4" />
              <p className="text-white/40">
                {language === 'DE' ? 'Keine offenen Stellen vorhanden' : 'No open positions available'}
              </p>
            </div>
          )}
        </motion.div>
      </section>

      {/* Application Modal */}
      {showApplication && selectedJob && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-neutral-900 rounded-2xl border border-white/10 w-full max-w-2xl max-h-[90vh] overflow-y-auto"
          >
            <div className="p-8">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-white">Apply for {selectedJob.title}</h2>
                  <p className="text-white/60">{selectedJob.department} • {selectedJob.location}</p>
                </div>
                <button
                  onClick={() => setShowApplication(false)}
                  className="p-2 text-white/60 hover:text-white"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-white/60 text-sm mb-2">Name *</label>
                    <input
                      type="text"
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full px-4 py-3 bg-black/50 border border-white/10 rounded-lg text-white placeholder:text-white/40"
                      placeholder="Max Mustermann"
                    />
                  </div>
                  <div>
                    <label className="block text-white/60 text-sm mb-2">Email *</label>
                    <input
                      type="email"
                      required
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="w-full px-4 py-3 bg-black/50 border border-white/10 rounded-lg text-white placeholder:text-white/40"
                      placeholder="max@example.com"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-white/60 text-sm mb-2">Phone</label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-4 py-3 bg-black/50 border border-white/10 rounded-lg text-white placeholder:text-white/40"
                    placeholder="+41 79 123 45 67"
                  />
                </div>

                <div>
                  <label className="block text-white/60 text-sm mb-2">Message</label>
                  <textarea
                    rows={4}
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    className="w-full px-4 py-3 bg-black/50 border border-white/10 rounded-lg text-white placeholder:text-white/40 resize-none"
                    placeholder="Tell us about yourself..."
                  />
                </div>

                <div>
                  <label className="block text-white/60 text-sm mb-2">CV / Resume *</label>
                  <div 
                    className="border-2 border-dashed border-white/20 rounded-lg p-8 text-center hover:border-red-500/50 transition-colors cursor-pointer relative"
                    onClick={() => document.getElementById('cv-upload')?.click()}
                    onDragOver={(e) => { e.preventDefault(); e.stopPropagation() }}
                    onDrop={(e) => {
                      e.preventDefault()
                      e.stopPropagation()
                      const files = e.dataTransfer.files
                      if (files.length > 0) {
                        setCvFile(files[0])
                      }
                    }}
                  >
                    <input
                      id="cv-upload"
                      type="file"
                      accept=".pdf,.doc,.docx"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0]
                        if (file) setCvFile(file)
                      }}
                    />
                    {cvFile ? (
                      <div className="text-white">
                        <p className="font-medium">{cvFile.name}</p>
                        <p className="text-sm text-white/60">Click to change file</p>
                      </div>
                    ) : (
                      <div>
                        <p className="text-white/60">Drag & drop your CV here or click to browse</p>
                        <p className="text-sm text-white/40 mt-2">PDF, DOC, DOCX up to 5MB</p>
                      </div>
                    )}
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={submitting || !cvFile}
                  className="w-full py-4 bg-red-500 hover:bg-red-600 disabled:bg-white/10 disabled:text-white/40 text-white font-semibold rounded-lg transition-colors"
                >
                  {submitting ? 'Submitting...' : 'Submit Application'}
                </button>
              </form>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  )
}
