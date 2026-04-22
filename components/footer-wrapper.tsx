'use client'

import { usePathname } from 'next/navigation'
import { Footer } from './footer'

export function FooterWrapper() {
  const pathname = usePathname()
  
  // Hide footer on dashboard and admin pages
  if (pathname?.startsWith('/dashboard') || pathname?.startsWith('/admin')) {
    return null
  }
  
  return <Footer />
}
