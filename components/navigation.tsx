'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Menu, X, Globe } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { LogoIcon } from './logo'
import { useLanguage } from './language-provider'

const adminNavItems = [
  { name: 'Admin', href: '/admin' },
]

export function Navigation() {
  const [isOpen, setIsOpen] = useState(false)
  const [isScrolled, setIsScrolled] = useState(false)
  const { language, setLanguage, t } = useLanguage()
  const pathname = usePathname()

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const toggleLanguage = () => {
    const newLang = language === 'EN' ? 'DE' : 'EN'
    setLanguage(newLang)
  }

  const navItems = [
    { name: t.nav.home, href: '/' },
    { name: t.nav.events, href: '/events' },
    { name: t.nav.club, href: '/club' },
    { name: t.nav.location, href: '/location' },
    { name: t.nav.rental, href: '/rental' },
    { name: t.nav.career, href: '/career' },
  ]

  return (
    <header
      className={cn(
        'fixed top-0 left-0 right-0 z-50',
        isScrolled ? 'bg-black/90' : 'bg-transparent'
      )}
    >
      <div className="container mx-auto pl-2 pr-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 lg:h-20">
          {/* Logo */}
          <Link href="/" className="relative z-50 flex items-center">
            <LogoIcon className="h-[50px] w-auto" />
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            {navItems.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  'text-sm font-medium tracking-wide uppercase transition-colors hover:text-red-500',
                  pathname === item.href ? 'text-red-500' : 'text-white/80'
                )}
              >
                {item.name}
              </Link>
            ))}
            <span className="w-px h-4 bg-white/20" />
            {adminNavItems.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  'text-sm font-medium tracking-wide uppercase transition-colors hover:text-red-500',
                  pathname === item.href ? 'text-red-500' : 'text-white/60'
                )}
              >
                {item.name}
              </Link>
            ))}
            
            {/* Language Toggle */}
            <button
              onClick={toggleLanguage}
              className="flex items-center gap-1.5 text-sm font-medium text-white/70 hover:text-white transition-colors"
              title="Switch language"
            >
              <Globe className="w-4 h-4" />
              <span>{language}</span>
            </button>
            
            <Button
              variant="glitch"
              size="sm"
              className="ml-4"
              asChild
            >
              <Link href="/events">{t.nav.getTickets}</Link>
            </Button>
          </nav>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="md:hidden relative z-50 p-2 text-white"
            aria-label="Toggle menu"
          >
            {isOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {/* Mobile Navigation */}
      {isOpen && (
        <div className="fixed inset-0 z-40 bg-black md:hidden">
          <div className="flex flex-col items-center justify-center h-full space-y-8">
            {navItems.map((item) => (
              <div key={item.name}>
                <Link
                  href={item.href}
                  onClick={() => setIsOpen(false)}
                  className={cn(
                    'text-3xl font-bold tracking-wide uppercase transition-colors hover:text-red-500',
                    pathname === item.href ? 'text-red-500' : 'text-white'
                  )}
                >
                  {item.name}
                </Link>
              </div>
            ))}
            
            {/* Mobile Language Toggle */}
            <button
              onClick={() => {
                toggleLanguage()
                setIsOpen(false)
              }}
              className="flex items-center gap-2 text-white/70 hover:text-white transition-colors"
            >
              <Globe className="w-5 h-5" />
              <span className="text-lg font-medium">{language === 'EN' ? 'English' : 'Deutsch'}</span>
            </button>
            
            <div>
              <Button
                variant="glitch"
                size="lg"
                onClick={() => setIsOpen(false)}
                asChild
              >
                <Link href="/events">{t.nav.getTickets}</Link>
              </Button>
            </div>
          </div>
        </div>
      )}
    </header>
  )
}
