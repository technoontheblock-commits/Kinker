'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { 
  Briefcase, 
  MapPin, 
  Clock, 
  CheckCircle2, 
  Send,
  Mail,
  Users,
  Sparkles,
  GraduationCap,
  PartyPopper,
  Coffee
} from 'lucide-react'
import { careerInfo } from '@/lib/data'
import { useLanguage } from '@/components/language-provider'

const benefitIcons = [
  { icon: <Sparkles className="w-6 h-6" /> },
  { icon: <Clock className="w-6 h-6" /> },
  { icon: <PartyPopper className="w-6 h-6" /> },
  { icon: <GraduationCap className="w-6 h-6" /> },
  { icon: <Users className="w-6 h-6" /> },
  { icon: <Coffee className="w-6 h-6" /> },
]

export default function CareerPage() {
  const { t, language } = useLanguage()
  const [selectedJob, setSelectedJob] = useState<any>(null)
  const [showApplication, setShowApplication] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  const handleApply = (job: any) => {
    setSelectedJob(job)
    setShowApplication(true)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitted(true)
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
            {careerInfo.jobs.map((job, index) => (
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
          {careerInfo.jobs.length === 0 && (
            <div className="text-center py-16 bg-neutral-900/30 rounded-2xl border border-white/10">
              <Briefcase className="w-16 h-16 text-white/20 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-white mb-2">
                {language === 'DE' ? 'Aktuell keine offenen Stellen' : 'No open positions currently'}
              </h3>
              <p className="text-white/60">
                {language === 'DE' 
                  ? 'Schau später wieder vorbei oder sende uns eine Initiativbewerbung.' 
                  : 'Check back later or send us a spontaneous application.'}
              </p>
            </div>
          )}
        </motion.div>
      </section>

      {/* Contact Section */}
      <section className="container mx-auto px-4 sm:px-6 lg:px-8 pb-24">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="bg-gradient-to-r from-red-500/10 to-transparent rounded-2xl p-8 border border-red-500/30"
        >
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div>
              <h3 className="text-2xl font-bold text-white mb-2 font-display">
                {language === 'DE' ? 'Initiativbewerbung' : 'Spontaneous Application'}
              </h3>
              <p className="text-white/70">
                {language === 'DE' 
                  ? 'Nichts Passendes gefunden? Sende uns trotzdem deine Bewerbung!' 
                  : "Didn't find a match? Send us your application anyway!"}
              </p>
            </div>
            <a
              href={`mailto:${careerInfo.contact.email}`}
              className="flex items-center gap-3 px-6 py-3 bg-red-500 hover:bg-red-600 text-white font-semibold rounded-lg transition-colors"
            >
              <Mail className="w-5 h-5" />
              {careerInfo.contact.email}
            </a>
          </div>
        </motion.div>
      </section>

      {/* Application Modal */}
      {showApplication && selectedJob && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-neutral-900 rounded-2xl p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-white/10"
          >
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold text-white">
                  {language === 'DE' ? 'Bewerbung' : 'Application'}
                </h2>
                <p className="text-white/60">{selectedJob.title}</p>
              </div>
              <button
                onClick={() => setShowApplication(false)}
                className="p-2 text-white/60 hover:text-white"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-white/80 mb-2 text-sm">{t.career.form.firstName} *</label>
                  <input
                    type="text"
                    required
                    className="w-full px-4 py-3 bg-black border border-white/20 rounded-lg text-white focus:outline-none focus:border-red-500"
                    placeholder={t.career.form.placeholder.firstName}
                  />
                </div>
                <div>
                  <label className="block text-white/80 mb-2 text-sm">{t.career.form.lastName} *</label>
                  <input
                    type="text"
                    required
                    className="w-full px-4 py-3 bg-black border border-white/20 rounded-lg text-white focus:outline-none focus:border-red-500"
                    placeholder={t.career.form.placeholder.lastName}
                  />
                </div>
              </div>

              <div>
                <label className="block text-white/80 mb-2 text-sm">{t.career.form.email} *</label>
                <input
                  type="email"
                  required
                  className="w-full px-4 py-3 bg-black border border-white/20 rounded-lg text-white focus:outline-none focus:border-red-500"
                  placeholder="max@example.com"
                />
              </div>

              <div>
                <label className="block text-white/80 mb-2 text-sm">{t.career.form.phone}</label>
                <input
                  type="tel"
                  className="w-full px-4 py-3 bg-black border border-white/20 rounded-lg text-white focus:outline-none focus:border-red-500"
                  placeholder="+41 79 123 45 67"
                />
              </div>

              <div>
                <label className="block text-white/80 mb-2 text-sm">{t.career.form.message} *</label>
                <textarea
                  rows={4}
                  required
                  className="w-full px-4 py-3 bg-black border border-white/20 rounded-lg text-white focus:outline-none focus:border-red-500"
                  placeholder={t.career.form.placeholder.message}
                />
              </div>

              <div>
                <label className="block text-white/80 mb-2 text-sm">
                  {language === 'DE' ? 'Lebenslauf (PDF)' : 'Resume (PDF)'}
                </label>
                <input
                  type="file"
                  accept=".pdf,.doc,.docx"
                  className="w-full px-4 py-3 bg-black border border-white/20 rounded-lg text-white/60 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:bg-red-500 file:text-white hover:file:bg-red-600"
                />
              </div>

              <div className="flex gap-4 pt-4">
                <button
                  type="button"
                  onClick={() => setShowApplication(false)}
                  className="flex-1 py-3 border border-white/20 text-white rounded-lg hover:bg-white/5 transition-colors"
                >
                  {t.common.cancel}
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors flex items-center justify-center gap-2"
                >
                  <Send className="w-4 h-4" />
                  {t.career.form.submit}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  )
}
