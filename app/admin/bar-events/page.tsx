'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function BarEventsRedirectPage() {
  const router = useRouter()

  useEffect(() => {
    router.replace('/admin/bar-reports')
  }, [router])

  return (
    <div className="p-6 text-white/60">
      Weiterleitung zu Bar Reports & Events...
    </div>
  )
}
