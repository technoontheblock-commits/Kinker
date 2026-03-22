import Link from 'next/link'
import { Button } from '@/components/ui/button'

export default function NotFound() {
  return (
    <div className="min-h-screen bg-black flex items-center justify-center px-4">
      <div className="text-center">
        <h1 className="text-8xl md:text-9xl font-bold text-white font-display mb-4">
          404
        </h1>
        <p className="text-xl md:text-2xl text-white/60 mb-8">
          Page not found. The beat dropped here.
        </p>
        <Button variant="glitch" size="lg" asChild>
          <Link href="/">Back to Home</Link>
        </Button>
      </div>
    </div>
  )
}
