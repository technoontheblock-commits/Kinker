'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { ShoppingBag, Plus, Minus, X, ShoppingCart, Trash2, Ticket, Tag, Loader2 } from 'lucide-react'

interface Product {
  id: string
  name: string
  description: string
  price: number
  image: string
  category: string
  sizes: string[]
  stock: number
  type?: 'local' | 'printful'
  variants?: Array<{
    id: number
    name: string
    sku: string
    price: string
    size: string
    color: string
    image?: string
  }>
}

export default function MerchPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [cart, setCart] = useState<any[]>([])
  const [cartData, setCartData] = useState<any>(null)
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [selectedSize, setSelectedSize] = useState('')
  const [selectedVariant, setSelectedVariant] = useState<any>(null)
  const [showCart, setShowCart] = useState(false)
  const [loading, setLoading] = useState(true)
  const [discountCode, setDiscountCode] = useState('')
  const [discountLoading, setDiscountLoading] = useState(false)
  const [discountError, setDiscountError] = useState('')
  const [appliedDiscount, setAppliedDiscount] = useState<any>(null)

  useEffect(() => {
    loadProducts()
    loadCart()
  }, [])

  const loadProducts = async () => {
    try {
      const response = await fetch('/api/merchandise')
      if (response.ok) {
        const data = await response.json()
        setProducts(data)
      }
    } catch (error) {
      console.error('Error loading products:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadCart = async () => {
    try {
      const response = await fetch('/api/cart')
      if (response.ok) {
        const data = await response.json()
        setCart(data.items || [])
        setCartData(data)
        setAppliedDiscount(data.discount)
      }
    } catch (error) {
      console.error('Error loading cart:', error)
    }
  }

  const applyDiscount = async () => {
    if (!discountCode.trim()) return
    
    setDiscountLoading(true)
    setDiscountError('')
    
    try {
      const res = await fetch('/api/cart/discount', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: discountCode.trim() })
      })
      
      const data = await res.json()
      
      if (res.ok) {
        setAppliedDiscount(data.discount)
        setDiscountCode('')
        await loadCart()
      } else {
        setDiscountError(data.error || 'Invalid code')
      }
    } catch (error) {
      setDiscountError('Failed to apply code')
    } finally {
      setDiscountLoading(false)
    }
  }

  const removeDiscount = async () => {
    await fetch('/api/cart/discount', { method: 'DELETE' })
    setAppliedDiscount(null)
    await loadCart()
  }

  const addToCart = async () => {
    if (!selectedProduct || !selectedSize) {
      alert('Bitte Grösse/Variante wählen')
      return
    }
    if (selectedProduct.type === 'printful' && !selectedVariant) {
      alert('Bitte Variante wählen')
      return
    }

    const metadata: any = {}
    if (selectedProduct.type === 'printful' && selectedVariant) {
      metadata.printful_variant_id = selectedVariant.id
      metadata.printful_price = selectedVariant.price
      metadata.printful_name = selectedVariant.name
    }

    try {
      const res = await fetch('/api/cart', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          product_id: selectedProduct.id,
          quantity: 1,
          selected_size: selectedSize,
          metadata
        })
      })
      
      if (!res.ok) {
        const err = await res.json()
        alert('Fehler: ' + (err.error || 'Unbekannter Fehler'))
        return
      }

      await loadCart()
      setSelectedProduct(null)
      setSelectedSize('')
      setSelectedVariant(null)
      setShowCart(true)
    } catch (e: any) {
      alert('Netzwerkfehler: ' + e.message)
    }
  }

  const updateQuantity = async (itemId: string, delta: number) => {
    const item = cart.find(i => i.id === itemId)
    if (!item) return

    const newQuantity = item.quantity + delta
    
    if (newQuantity <= 0) {
      await removeItem(itemId)
    } else {
      await fetch('/api/cart', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: itemId, quantity: newQuantity })
      })
      await loadCart()
    }
  }

  const removeItem = async (itemId: string) => {
    try {
      await fetch('/api/cart?id=' + itemId, { method: 'DELETE' })
      await loadCart()
    } catch (error) {
      console.error('Error removing item:', error)
    }
  }

  const [checkoutLoading, setCheckoutLoading] = useState(false)

  const handleCheckout = async () => {
    if (cart.length === 0 || !cartData) {
      alert('Warenkorb ist leer')
      return
    }

    setCheckoutLoading(true)

    try {
      const ref = 'KINKER-' + Date.now()
      const res = await fetch('/api/sumup/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: cartData.total,
          description: `KINKER Order (${cart.reduce((s, i) => s + i.quantity, 0)} items)`,
          checkout_reference: ref,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        alert('Checkout-Fehler: ' + (data.error || 'Unbekannter Fehler'))
        return
      }

      if (data.id) {
        window.location.href = '/checkout?id=' + data.id
      } else {
        alert('Keine Checkout-ID erhalten')
      }
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Unbekannter Fehler'
      alert('Checkout-Fehler: ' + msg)
    } finally {
      setCheckoutLoading(false)
    }
  }

  const subtotal = cart.reduce((sum, item) => sum + (item.product?.price * item.quantity), 0)
  const total = cartData?.total ?? subtotal
  const discountAmount = cartData?.discountAmount ?? 0
  const categories = Array.from(new Set(products.map(p => p.category)))

  return (
    <div className="min-h-screen bg-black pt-24">
      {/* Header */}
      <section className="container mx-auto px-4 mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-5xl font-bold text-white">MERCH</h1>
            <p className="text-white/60 mt-2">Official KINKER Store</p>
          </div>
          <button
            onClick={() => setShowCart(true)}
            className="relative p-4 bg-neutral-900 rounded-full"
          >
            <ShoppingCart className="w-6 h-6 text-white" />
            {cart.length > 0 && (
              <span className="absolute -top-1 -right-1 w-6 h-6 bg-red-500 rounded-full text-white text-sm flex items-center justify-center">
                {cart.reduce((sum, item) => sum + item.quantity, 0)}
              </span>
            )}
          </button>
        </div>
      </section>

      {/* Products */}
      <section className="container mx-auto px-4 pb-24">
        {loading ? (
          <div className="flex justify-center py-24">
            <div className="w-8 h-8 border-2 border-red-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {products.map((product) => (
              <div
                key={product.id}
                onClick={() => {
                  setSelectedProduct(product)
                  setSelectedSize(product.sizes[0] || '')
                  if (product.type === 'printful' && product.variants?.length) {
                    setSelectedVariant(product.variants[0])
                  } else {
                    setSelectedVariant(null)
                  }
                }}
                className="bg-neutral-900 rounded-xl overflow-hidden cursor-pointer hover:border-red-500/50 border border-white/10 transition-all group"
              >
                <div className="aspect-square bg-neutral-800 relative overflow-hidden">
                  {product.image ? (
                    <img 
                      src={product.image} 
                      alt={product.name} 
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <ShoppingBag className="w-16 h-16 text-white/20" />
                    </div>
                  )}
                  {product.type === 'printful' && (
                    <span className="absolute top-3 left-3 px-2.5 py-1 bg-red-500/90 text-white text-xs font-medium rounded-full">
                      Print on Demand
                    </span>
                  )}
                </div>
                <div className="p-4">
                  <h3 className="font-semibold text-white truncate">{product.name}</h3>
                  <p className="text-white/50 text-xs mt-1 line-clamp-2">
                    {product.description || (product.type === 'printful' 
                      ? 'Hochwertiges Print-on-Demand Produkt' 
                      : 'Offizielles KINKER Merch')}
                  </p>
                  <div className="flex items-center justify-between mt-3">
                    <p className="text-red-500 font-bold">
                      CHF {product.type === 'printful' && product.variants?.[0] 
                        ? product.variants[0].price 
                        : product.price}
                    </p>
                    {product.type === 'printful' && product.variants && product.variants.length > 1 && (
                      <span className="text-white/40 text-xs">
                        {product.variants.length} Varianten
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Product Modal */}
      {selectedProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4" onClick={() => setSelectedProduct(null)}>
          <div 
            className="bg-neutral-900 rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto border border-white/10"
            onClick={e => e.stopPropagation()}
          >
            {/* Image */}
            <div className="relative h-64 sm:h-72 bg-white rounded-t-2xl">
              {(selectedProduct.type === 'printful' && selectedVariant?.image) ? (
                <img 
                  src={selectedVariant.image} 
                  alt={selectedVariant.name} 
                  className="w-full h-full object-contain rounded-t-2xl p-4" 
                />
              ) : selectedProduct.image ? (
                <img 
                  src={selectedProduct.image} 
                  alt={selectedProduct.name} 
                  className="w-full h-full object-contain rounded-t-2xl p-4" 
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <ShoppingBag className="w-16 h-16 text-neutral-300" />
                </div>
              )}
              <button 
                onClick={() => setSelectedProduct(null)} 
                className="absolute top-3 right-3 p-2 bg-black/60 rounded-full text-white/80 hover:text-white hover:bg-black/80 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
              {selectedProduct.type === 'printful' && (
                <span className="absolute top-3 left-3 px-3 py-1 bg-red-500/90 text-white text-xs font-medium rounded-full">
                  Print on Demand
                </span>
              )}
            </div>
            
            {/* Content */}
            <div className="p-6">
              {/* Title & Price */}
              <div className="mb-4">
                <h2 className="text-2xl font-bold text-white mb-2">{selectedProduct.name}</h2>
                <div className="flex items-baseline gap-3">
                  <p className="text-2xl font-bold text-red-500">
                    CHF {selectedProduct.type === 'printful' && selectedVariant ? selectedVariant.price : selectedProduct.price}
                  </p>
                  {selectedProduct.type === 'printful' && (
                    <span className="text-white/40 text-sm">Inkl. MwSt.</span>
                  )}
                </div>
              </div>
              
              {/* Description */}
              <div className="mb-5">
                <p className="text-white/60 text-sm leading-relaxed">
                  {selectedProduct.description || (selectedProduct.type === 'printful' 
                    ? 'Hochwertiges Print-on-Demand Produkt. Wird nach Bestellung individuell für dich produziert und direkt zu dir geliefert.'
                    : 'Offizielles KINKER Merchandise. Limitierte Stückzahl.')
                  }
                </p>
              </div>
              
              {/* Divider */}
              <div className="border-t border-white/10 mb-5" />
              
              {/* Variants (Printful) */}
              {selectedProduct.type === 'printful' && selectedProduct.variants && selectedProduct.variants.length > 0 && (
                <div className="mb-5">
                  <div className="flex items-center justify-between mb-3">
                    <label className="text-white/80 text-sm font-medium">Farbe & Grösse</label>
                    {selectedVariant && (
                      <span className="text-white/50 text-xs">SKU: {selectedVariant.sku}</span>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {selectedProduct.variants.map((variant: any) => (
                      <button
                        key={variant.id}
                        onClick={() => {
                          setSelectedVariant(variant)
                          setSelectedSize(variant.size || 'One Size')
                        }}
                        className={`px-4 py-2.5 rounded-xl border text-sm font-medium transition-all ${
                          selectedVariant?.id === variant.id
                            ? 'border-red-500 bg-red-500/20 text-white shadow-lg shadow-red-500/10'
                            : 'border-white/20 text-white/70 hover:border-white/40 hover:text-white'
                        }`}
                      >
                        <span className="block">{variant.color}</span>
                        <span className="text-xs opacity-70">{variant.size}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Sizes (Local) */}
              {selectedProduct.type !== 'printful' && selectedProduct.sizes.length > 0 && (
                <div className="mb-5">
                  <label className="text-white/80 text-sm font-medium mb-3 block">Grösse</label>
                  <div className="flex flex-wrap gap-2">
                    {selectedProduct.sizes.map(size => (
                      <button
                        key={size}
                        onClick={() => setSelectedSize(size)}
                        className={`px-4 py-2.5 rounded-xl border text-sm font-medium transition-all ${
                          selectedSize === size
                            ? 'border-red-500 bg-red-500/20 text-white shadow-lg shadow-red-500/10'
                            : 'border-white/20 text-white/70 hover:border-white/40 hover:text-white'
                        }`}
                      >
                        {size}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              
              {/* Info box for Printful */}
              {selectedProduct.type === 'printful' && (
                <div className="mb-5 p-3 bg-white/5 rounded-xl border border-white/10">
                  <div className="flex items-start gap-2">
                    <svg className="w-4 h-4 text-white/40 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <p className="text-white/50 text-xs leading-relaxed">
                      Print-on-Demand: Produktion beginnt nach Zahlungseingang. Lieferzeit ca. 5-10 Werktage. 
                      Jedes Stück wird individuell für dich hergestellt.
                    </p>
                  </div>
                </div>
              )}
              
              {/* Add to Cart */}
              <button
                onClick={addToCart}
                disabled={!selectedSize || (selectedProduct.type === 'printful' && !selectedVariant)}
                className="w-full py-3.5 bg-red-500 hover:bg-red-600 disabled:bg-white/10 disabled:text-white/30 text-white font-semibold rounded-xl transition-colors"
              >
                {selectedProduct.type === 'printful' && !selectedVariant 
                  ? 'Variante wählen' 
                  : 'In den Warenkorb'
                }
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Cart Sidebar */}
      {showCart && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="absolute inset-0 bg-black/60" onClick={() => setShowCart(false)} />
          <div className="relative w-full max-w-md bg-neutral-900 h-full border-l border-white/10 p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-white">Warenkorb</h2>
              <button onClick={() => setShowCart(false)} className="text-white/60">
                <X className="w-6 h-6" />
              </button>
            </div>

            {cart.length === 0 ? (
              <p className="text-white/40 text-center py-12">Warenkorb ist leer</p>
            ) : (
              <>
                <div className="space-y-4 mb-6">
                  {cart.map((item) => (
                    <div key={item.id} className="flex gap-4 p-4 bg-black/30 rounded-lg">
                      <div className="flex-1">
                        <p className="text-white font-medium">{item.product?.name}</p>
                        <p className="text-white/60 text-sm">{item.selected_size}</p>
                        <div className="flex items-center gap-2 mt-2">
                          <button onClick={() => updateQuantity(item.id, -1)} className="p-1 text-white/60 hover:text-white">
                            <Minus className="w-4 h-4" />
                          </button>
                          <span className="text-white w-6 text-center">{item.quantity}</span>
                          <button onClick={() => updateQuantity(item.id, 1)} className="p-1 text-white/60 hover:text-white">
                            <Plus className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        <button 
                          onClick={() => removeItem(item.id)}
                          className="p-1 text-white/40 hover:text-red-500 transition-colors"
                          title="Entfernen"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                        <p className="text-white font-semibold">CHF {(item.product?.price * item.quantity).toFixed(2)}</p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Discount Code */}
                <div className="border-t border-white/10 pt-4 mb-4">
                  {appliedDiscount ? (
                    <div className="flex items-center justify-between p-3 bg-green-500/10 border border-green-500/20 rounded-lg mb-3">
                      <div className="flex items-center gap-2">
                        <Tag className="w-4 h-4 text-green-500" />
                        <div>
                          <p className="text-green-500 font-medium text-sm">{appliedDiscount.name}</p>
                          <p className="text-white/60 text-xs">Code: {appliedDiscount.code}</p>
                        </div>
                      </div>
                      <button 
                        onClick={removeDiscount}
                        className="text-white/40 hover:text-red-500"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <div className="flex gap-2 mb-3">
                      <div className="flex-1 relative">
                        <Ticket className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                        <input
                          type="text"
                          value={discountCode}
                          onChange={(e) => setDiscountCode(e.target.value.toUpperCase())}
                          placeholder="Reward Code (KINKER-XXX)"
                          className="w-full bg-black/50 border border-white/10 rounded-lg py-2 pl-10 pr-3 text-sm text-white placeholder:text-white/40 focus:outline-none focus:border-red-500"
                        />
                      </div>
                      <button
                        onClick={applyDiscount}
                        disabled={discountLoading || !discountCode.trim()}
                        className="px-4 py-2 bg-white/10 hover:bg-white/20 disabled:opacity-50 text-white text-sm rounded-lg transition-colors"
                      >
                        {discountLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Apply'}
                      </button>
                    </div>
                  )}
                  {discountError && (
                    <p className="text-red-500 text-xs mb-3">{discountError}</p>
                  )}
                  
                  {/* Price Breakdown */}
                  <div className="space-y-2 mb-4">
                    <div className="flex justify-between text-white/60 text-sm">
                      <span>Subtotal</span>
                      <span>CHF {subtotal.toFixed(2)}</span>
                    </div>
                    {discountAmount > 0 && (
                      <div className="flex justify-between text-green-500 text-sm">
                        <span>Discount</span>
                        <span>- CHF {discountAmount.toFixed(2)}</span>
                      </div>
                    )}
                    <div className="flex justify-between text-xl font-bold text-white pt-2 border-t border-white/10">
                      <span>Total</span>
                      <span>CHF {total.toFixed(2)}</span>
                    </div>
                  </div>

                  <button
                    onClick={handleCheckout}
                    disabled={checkoutLoading}
                    className="w-full py-3.5 bg-red-500 hover:bg-red-600 disabled:bg-white/10 disabled:text-white/30 text-white font-semibold rounded-xl transition-colors flex items-center justify-center gap-2"
                  >
                    {checkoutLoading ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Wird geladen...
                      </>
                    ) : (
                      'Zur Kasse'
                    )}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
