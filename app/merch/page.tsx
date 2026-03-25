'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { ShoppingBag, Plus, Minus, X, ShoppingCart } from 'lucide-react'
import Link from 'next/link'

interface Product {
  id: string
  name: string
  description: string
  price: number
  image: string
  category: string
  sizes: string[]
  stock: number
}

export default function MerchPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [cart, setCart] = useState<any[]>([])
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [selectedSize, setSelectedSize] = useState('')
  const [showCart, setShowCart] = useState(false)
  const [loading, setLoading] = useState(true)

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
      }
    } catch (error) {
      console.error('Error loading cart:', error)
    }
  }

  const addToCart = async () => {
    if (!selectedProduct || !selectedSize) return

    await fetch('/api/cart', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        product_id: selectedProduct.id,
        quantity: 1,
        selected_size: selectedSize
      })
    })

    await loadCart()
    setSelectedProduct(null)
    setSelectedSize('')
    setShowCart(true)
  }

  const updateQuantity = async (itemId: string, delta: number) => {
    const item = cart.find(i => i.id === itemId)
    if (!item) return

    const newQuantity = item.quantity + delta
    
    if (newQuantity <= 0) {
      await fetch('/api/cart?id=' + itemId, { method: 'DELETE' })
    } else {
      await fetch('/api/cart', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: itemId, quantity: newQuantity })
      })
    }

    await loadCart()
  }

  const total = cart.reduce((sum, item) => sum + (item.product?.price * item.quantity), 0)
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
                }}
                className="bg-neutral-900 rounded-xl overflow-hidden cursor-pointer hover:border-red-500/50 border border-white/10 transition-all"
              >
                <div className="aspect-square bg-neutral-800">
                  {product.image ? (
                    <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <ShoppingBag className="w-16 h-16 text-white/20" />
                    </div>
                  )}
                </div>
                <div className="p-4">
                  <h3 className="font-semibold text-white">{product.name}</h3>
                  <p className="text-red-500 font-bold mt-1">CHF {product.price}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Product Modal */}
      {selectedProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
          <div className="bg-neutral-900 rounded-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            {/* Image - smaller height */}
            <div className="relative h-48 sm:h-56 bg-neutral-800 rounded-t-2xl">
              {selectedProduct.image ? (
                <img src={selectedProduct.image} alt={selectedProduct.name} className="w-full h-full object-cover rounded-t-2xl" />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <ShoppingBag className="w-16 h-16 text-white/20" />
                </div>
              )}
              <button 
                onClick={() => setSelectedProduct(null)} 
                className="absolute top-3 right-3 p-2 bg-black/50 rounded-full text-white/80 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            {/* Content */}
            <div className="p-5">
              <h2 className="text-xl font-bold text-white mb-1">{selectedProduct.name}</h2>
              <p className="text-xl font-bold text-red-500 mb-3">CHF {selectedProduct.price}</p>
              
              <p className="text-white/60 text-sm mb-4">{selectedProduct.description}</p>
              
              {selectedProduct.sizes.length > 0 && (
                <div className="mb-4">
                  <label className="text-white/70 text-sm mb-2 block">Grösse</label>
                  <div className="flex flex-wrap gap-2">
                    {selectedProduct.sizes.map(size => (
                      <button
                        key={size}
                        onClick={() => setSelectedSize(size)}
                        className={`px-3 py-2 rounded-lg border text-sm ${
                          selectedSize === size
                            ? 'border-red-500 bg-red-500/20 text-white'
                            : 'border-white/20 text-white/70'
                        }`}
                      >
                        {size}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              
              <button
                onClick={addToCart}
                disabled={!selectedSize}
                className="w-full py-3 bg-red-500 hover:bg-red-600 disabled:bg-white/10 text-white font-semibold rounded-lg"
              >
                In den Warenkorb
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
                          <button onClick={() => updateQuantity(item.id, -1)} className="p-1 text-white/60">
                            <Minus className="w-4 h-4" />
                          </button>
                          <span className="text-white w-6 text-center">{item.quantity}</span>
                          <button onClick={() => updateQuantity(item.id, 1)} className="p-1 text-white/60">
                            <Plus className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                      <p className="text-white font-semibold">CHF {(item.product?.price * item.quantity).toFixed(2)}</p>
                    </div>
                  ))}
                </div>

                <div className="border-t border-white/10 pt-4">
                  <div className="flex justify-between text-xl font-bold text-white mb-4">
                    <span>Total</span>
                    <span>CHF {total.toFixed(2)}</span>
                  </div>
                  <Link
                    href="/checkout"
                    className="block w-full py-4 bg-red-500 hover:bg-red-600 text-white text-center font-semibold rounded-lg"
                  >
                    Zur Kasse
                  </Link>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
