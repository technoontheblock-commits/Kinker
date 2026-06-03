import { randomBytes, randomUUID } from 'crypto'
import QRCode from 'qrcode'

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://kinker.ch'

/**
 * Generate a cryptographically secure random token for bonus card QR codes
 */
export function generateBonusCardToken(): string {
  return randomBytes(32).toString('hex')
}

/**
 * Generate a human-readable card number
 * Format: KINKER-BC-YYYY-000001
 */
export async function generateCardNumber(supabase: any): Promise<string> {
  const year = new Date().getFullYear()
  
  // Get count of bonus cards for this year
  const { count } = await supabase
    .from('bonus_cards')
    .select('*', { count: 'exact', head: true })
    .gte('created_at', `${year}-01-01`)
  
  const sequence = (count || 0) + 1
  return `KINKER-BC-${year}-${String(sequence).padStart(6, '0')}`
}

/**
 * Generate the QR code data string that will be encoded in the QR code
 * Format: KINKER-BC-{token}
 */
export function generateQRData(token: string): string {
  return `KINKER-BC-${token}`
}

/**
 * Generate a QR code data URL (base64 PNG) for display on web
 */
export async function generateQRCodeDataUrl(token: string): Promise<string> {
  const qrData = generateQRData(token)
  return QRCode.toDataURL(qrData, {
    width: 512,
    margin: 2,
    color: {
      dark: '#000000',
      light: '#ffffff'
    }
  })
}

/**
 * Generate a public view URL for the bonus card
 */
export function generateCardViewUrl(token: string): string {
  return `${siteUrl}/bonuscard/view/${token}`
}

/**
 * Check if a QR code data string is a bonus card
 */
export function isBonusCardQR(qrData: string): boolean {
  return qrData.startsWith('KINKER-BC-')
}

/**
 * Extract the token from a bonus card QR data string
 */
export function extractTokenFromQR(qrData: string): string | null {
  if (!isBonusCardQR(qrData)) return null
  return qrData.replace('KINKER-BC-', '')
}

/**
 * Generate SVG QR code for server-side rendering (emails, PDFs)
 */
export async function generateQRSvg(token: string): Promise<string> {
  const qrData = generateQRData(token)
  return QRCode.toString(qrData, {
    type: 'svg',
    width: 512,
    margin: 2,
    color: {
      dark: '#000000',
      light: '#ffffff'
    }
  })
}
