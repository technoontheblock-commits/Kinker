export interface Bracelet {
  id: string
  nfcUid: string
  displayUid: string
  balance: number
  currency: string
  status: string
  eventId: string | null
}
