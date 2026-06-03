import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth'

/**
 * Google Wallet Pass Generation
 * 
 * NOTE: This endpoint is prepared but disabled until Google Cloud Project
 * with Wallet API access is configured.
 * 
 * To enable:
 * 1. Create Google Cloud Project
 * 2. Enable Google Wallet API
 * 3. Create Service Account and download key
 * 4. Create Generic Pass class in Google Wallet
 * 5. Implement pass object creation via REST API
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
      error: 'Google Wallet Integration ist noch nicht aktiviert',
      message: 'Bitte Google Cloud Projekt mit Wallet API konfigurieren',
      setupInstructions: [
        'Google Cloud Projekt erstellen',
        'Google Wallet API aktivieren',
        'Service Account erstellen und Schlüssel herunterladen',
        'Generic Pass Klasse in Google Wallet anlegen',
        'Diese API-Route implementieren'
      ]
    },
    { status: 503 }
  )
}
