export interface Customer {
  id: string
  name: string
  firstName: string
  email: string | null
  phone: string | null
  balance: number
  currency: string
  walletToken: string
}
