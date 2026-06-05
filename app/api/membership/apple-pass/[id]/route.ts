import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth'

/**
 * Apple Wallet Pass Generation
 * 
 * NOTE: This endpoint is prepared but disabled until Apple Developer Account
 * and Pass Type ID certificate are configured.
 * 
 * To enable:
 * 1. Get Apple Developer Account ($99/year)
 * 2. Create Pass Type ID in Apple Developer Portal
 * 3. Generate and download certificate
 * 4. Install passkit-generator npm package
 * 5. Implement pass generation and signing
 */

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  // Check auth
  const auth = await requireAuth()
  if (!auth.authorized) {
    return auth.response
  }

  // Return 503 Service Unavailable with helpful message
  return NextResponse.json(
    {
      error: 'Apple Wallet Integration ist noch nicht aktiviert',
      message: 'Bitte Apple Developer Account und Pass Type ID Zertifikat konfigurieren',
      setupInstructions: [
        'Apple Developer Account erstellen ($99/Jahr)',
        'Pass Type ID im Developer Portal anlegen',
        'Zertifikat herunterladen und im Projekt hinterlegen',
        'passkit-generator npm package installieren',
        'Diese API-Route implementieren'
      ]
    },
    { status: 503 }
  )
}
