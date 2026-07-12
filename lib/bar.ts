export function formatChf(amount: number): string {
  return new Intl.NumberFormat('de-CH', {
    style: 'currency',
    currency: 'CHF',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount)
}

export function normalizeNfcUid(input: string): string | null {
  if (!input || typeof input !== 'string') return null
  // NFC UIDs often contain colons (A1:B2:C3:D4) or are plain hex.
  // Normalize to uppercase hex without separators.
  const cleaned = input
    .trim()
    .toUpperCase()
    .replace(/[^0-9A-F]/g, '')
  return cleaned.length > 0 ? cleaned : null
}

export function formatNfcUidForDisplay(uid: string): string {
  const normalized = normalizeNfcUid(uid)
  if (!normalized) return ''
  // Display as A1:B2:C3:D4 for readability
  return normalized.match(/.{1,2}/g)?.join(':') || normalized
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
