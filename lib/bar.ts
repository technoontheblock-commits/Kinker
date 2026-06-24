export const BAR_WALLET_QR_PREFIX = 'KINKER-WALLET-'

export function formatChf(amount: number): string {
  return new Intl.NumberFormat('de-CH', {
    style: 'currency',
    currency: 'CHF',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount)
}

export function extractWalletTokenFromQR(qrCode: string): string | null {
  if (!qrCode || typeof qrCode !== 'string') return null
  const trimmed = qrCode.trim()
  if (!trimmed.startsWith(BAR_WALLET_QR_PREFIX)) return null
  return trimmed.slice(BAR_WALLET_QR_PREFIX.length)
}

export function generateOrderNumber(): string {
  const now = new Date()
  const date = now.toISOString().slice(0, 10).replace(/-/g, '')
  const random = Math.floor(1000 + Math.random() * 9000)
  return `BAR-${date}-${random}`
}

export function generateTopUpReference(): string {
  const now = new Date()
  const date = now.toISOString().slice(0, 10).replace(/-/g, '')
  const random = Math.floor(100000 + Math.random() * 900000)
  return `TOPUP-${date}-${random}`
}

export function getFirstName(fullName: string): string {
  return fullName?.split(' ')[0] || fullName || 'Gast'
}
