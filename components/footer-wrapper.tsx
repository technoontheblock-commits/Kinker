'use client'

import { usePathname } from 'next/navigation'
import { Footer } from './footer'

export function FooterWrapper() {
  const pathname = usePathname()
  
  // Hide footer on dashboard pages
  if (pathname?.startsWith('/dashboard')) {
    return null
  }
  
  return <Footer />
}
