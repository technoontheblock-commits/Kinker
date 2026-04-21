// Printful API v2 Helper
const PRINTFUL_API_URL = 'https://api.printful.com/v2'

function getHeaders() {
  const token = process.env.PRINTFUL_API_TOKEN
  const storeId = process.env.PRINTFUL_STORE_ID

  if (!token) {
    throw new Error('PRINTFUL_API_TOKEN not configured')
  }

  const headers: Record<string, string> = {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
  }

  if (storeId) {
    headers['X-PF-Store-Id'] = storeId
  }

  return headers
}

export async function printfulGet(endpoint: string) {
  const res = await fetch(`${PRINTFUL_API_URL}${endpoint}`, {
    method: 'GET',
    headers: getHeaders(),
  })

  if (!res.ok) {
    const err = await res.text()
    throw new Error(`Printful API error (${res.status}): ${err}`)
  }

  return res.json()
}

export async function printfulPost(endpoint: string, body: any) {
  const res = await fetch(`${PRINTFUL_API_URL}${endpoint}`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(body),
  })

  if (!res.ok) {
    const err = await res.text()
    throw new Error(`Printful API error (${res.status}): ${err}`)
  }

  return res.json()
}

// Get store products
export async function getPrintfulProducts() {
  return printfulGet('/store/products')
}

// Get product details with variants
export async function getPrintfulProduct(id: number) {
  return printfulGet(`/store/products/${id}`)
}

// Create order
export async function createPrintfulOrder(orderData: {
  external_id?: string
  shipping: string
  recipient: {
    name: string
    address1: string
    city: string
    country_code: string
    zip: string
    email: string
    phone?: string
    state_code?: string
    address2?: string
  }
  items: Array<{
    variant_id: number
    quantity: number
    retail_price?: string
    name?: string
  }>
}) {
  return printfulPost('/orders', orderData)
}

// Get order by ID
export async function getPrintfulOrder(id: number) {
  return printfulGet(`/orders/${id}`)
}

// Get all orders
export async function getPrintfulOrders() {
  return printfulGet('/orders')
}
