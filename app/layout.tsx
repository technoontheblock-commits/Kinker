import type { Metadata } from 'next'
import { Inter, Space_Grotesk } from 'next/font/google'
import './globals.css'
import { Navigation } from '@/components/navigation'
import { FooterWrapper } from '@/components/footer-wrapper'
import { LanguageProvider } from '@/components/language-provider'
import { SpeedInsights } from "@vercel/speed-insights/next"

const inter = Inter({ 
  subsets: ['latin'],
  variable: '--font-sans',
})

const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  variable: '--font-display',
  weight: ['400', '500', '600', '700'],
})

export const metadata: Metadata = {
  title: 'KINKER BASEL | Hard Techno Club',
  description: 'Hard Techno in Basel. No racism. No hate. Just music. The underground techno club experience.',
  keywords: ['techno', 'club', 'basel', 'underground', 'hard techno', 'rave', 'electronic music'],
  openGraph: {
    title: 'KINKER BASEL',
    description: 'Hard Techno in Basel. No racism. No hate. Just music.',
    type: 'website',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.variable} ${spaceGrotesk.variable} font-sans antialiased`}>
        <LanguageProvider>
          <Navigation />
          <main>{children}</main>
          <FooterWrapper />
          <SpeedInsights />
        </LanguageProvider>
      </body>
    </html>
  )
}
