'use client'

import { motion } from 'framer-motion'
import { Plus, Package, Eye, EyeOff, DollarSign, ShoppingBag, Trash2, X } from 'lucide-react'
import Image from 'next/image'

interface MerchandiseTabProps {
  merchandise: any[]
  showAddMerch: boolean
  setShowAddMerch: (v: boolean) => void
  editingMerch: any
  setEditingMerch: (m: any) => void
  newMerch: { name: string; description: string; price: string; category: string; sizes: string[]; stock: string; image: string }
  setNewMerch: (m: { name: string; description: string; price: string; category: string; sizes: string[]; stock: string; image: string }) => void
  handleAddMerch: (e: React.FormEvent) => Promise<void>
  toggleMerchStatus: (id: string, currentStatus: boolean) => Promise<void>
  deleteMerch: (id: string) => Promise<void>
}

export default function MerchandiseTab({
  merchandise,
  showAddMerch,
  setShowAddMerch,
  editingMerch,
  setEditingMerch,
  newMerch,
  setNewMerch,
  handleAddMerch,
  toggleMerchStatus,
  deleteMerch
}: MerchandiseTabProps) {
  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-4xl font-bold text-white">Merchandise</h1>
          <button
            onClick={() => setShowAddMerch(true)}
            className="flex items-center gap-2 px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors"
          >
            <Plus className="w-5 h-5" />
            Add Product
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-neutral-900/50 rounded-xl p-6 border border-white/10">
            <div className="flex items-center justify-between mb-4">
              <Package className="w-8 h-8 text-red-500" />
              <span className="text-3xl font-bold text-white">{merchandise.length}</span>
            </div>
            <p className="text-white/60">Total Products</p>
          </div>
          <div className="bg-neutral-900/50 rounded-xl p-6 border border-white/10">
            <div className="flex items-center justify-between mb-4">
              <Eye className="w-8 h-8 text-green-500" />
              <span className="text-3xl font-bold text-white">{merchandise.filter(m => m.active).length}</span>
            </div>
            <p className="text-white/60">Active</p>
          </div>
          <div className="bg-neutral-900/50 rounded-xl p-6 border border-white/10">
            <div className="flex items-center justify-between mb-4">
              <EyeOff className="w-8 h-8 text-white/50" />
              <span className="text-3xl font-bold text-white">{merchandise.filter(m => !m.active).length}</span>
            </div>
            <p className="text-white/60">Inactive</p>
          </div>
          <div className="bg-neutral-900/50 rounded-xl p-6 border border-white/10">
            <div className="flex items-center justify-between mb-4">
              <DollarSign className="w-8 h-8 text-yellow-500" />
              <span className="text-3xl font-bold text-white">
                {merchandise.reduce((sum, m) => sum + (m.stock || 0), 0)}
              </span>
            </div>
            <p className="text-white/60">Total Stock</p>
          </div>
        </div>

        {/* Products Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {merchandise.map((item) => (
            <div key={item.id} className="bg-neutral-900/50 rounded-xl overflow-hidden border border-white/10">
              {/* Image */}
              <div className="aspect-square bg-neutral-800 relative">
                {item.image ? (
                  <Image src={item.image} alt={item.name} fill className="object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <ShoppingBag className="w-16 h-16 text-white/20" />
                  </div>
                )}
                <span className={`absolute top-2 right-2 px-2 py-1 rounded text-xs ${
                  item.active ? 'bg-green-500/20 text-green-500' : 'bg-white/10 text-white/60'
                }`}>
                  {item.active ? 'Active' : 'Inactive'}
                </span>
              </div>

              {/* Info */}
              <div className="p-4">
                <div className="flex items-start justify-between mb-2">
                  <h3 className="font-semibold text-white">{item.name}</h3>
                  <span className="text-red-500 font-bold">CHF {item.price}</span>
                </div>
                <p className="text-white/60 text-sm mb-3 line-clamp-2">{item.description}</p>

                <div className="flex flex-wrap gap-2 mb-3">
                  {item.sizes?.map((size: string) => (
                    <span key={size} className="px-2 py-1 bg-white/10 rounded text-xs text-white">
                      {size}
                    </span>
                  ))}
                </div>

                <div className="flex items-center justify-between">
                  <span className={`text-sm ${item.stock < 10 ? 'text-red-400' : 'text-white/60'}`}>
                    Stock: {item.stock}
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => toggleMerchStatus(item.id, item.active)}
                      className="p-2 text-white/60 hover:text-white transition-colors"
                      title={item.active ? 'Deactivate' : 'Activate'}
                    >
                      {item.active ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                    <button
                      onClick={() => deleteMerch(item.id)}
                      className="p-2 text-white/60 hover:text-red-500 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {merchandise.length === 0 && (
          <div className="text-center py-12 text-white/40">
            <ShoppingBag className="w-16 h-16 mx-auto mb-4 opacity-50" />
            <p>No merchandise yet</p>
          </div>
        )}
      </motion.div>

      {/* Add Merchandise Modal */}
      {showAddMerch && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-neutral-900 rounded-2xl p-8 max-w-md w-full border border-white/10"
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-white">Add New Product</h2>
              <button
                onClick={() => setShowAddMerch(false)}
                className="p-2 text-white/60 hover:text-white"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            <form onSubmit={handleAddMerch} className="space-y-4">
              <div>
                <label className="block text-white/70 text-sm mb-2">Product Name</label>
                <input
                  type="text"
                  value={newMerch.name}
                  onChange={(e) => setNewMerch({ ...newMerch, name: e.target.value })}
                  className="w-full px-4 py-3 bg-black/50 border border-white/10 rounded-lg text-white placeholder:text-white/40 focus:outline-none focus:border-red-500"
                  placeholder="e.g. KINKER Hoodie"
                  required
                />
              </div>
              <div>
                <label className="block text-white/70 text-sm mb-2">Description</label>
                <textarea
                  value={newMerch.description}
                  onChange={(e) => setNewMerch({ ...newMerch, description: e.target.value })}
                  className="w-full px-4 py-3 bg-black/50 border border-white/10 rounded-lg text-white placeholder:text-white/40 focus:outline-none focus:border-red-500 resize-none"
                  placeholder="Product description..."
                  rows={2}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-white/70 text-sm mb-2">Price (CHF)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={newMerch.price}
                    onChange={(e) => setNewMerch({ ...newMerch, price: e.target.value })}
                    className="w-full px-4 py-3 bg-black/50 border border-white/10 rounded-lg text-white placeholder:text-white/40 focus:outline-none focus:border-red-500"
                    placeholder="49.90"
                    required
                  />
                </div>
                <div>
                  <label className="block text-white/70 text-sm mb-2">Stock</label>
                  <input
                    type="number"
                    value={newMerch.stock}
                    onChange={(e) => setNewMerch({ ...newMerch, stock: e.target.value })}
                    className="w-full px-4 py-3 bg-black/50 border border-white/10 rounded-lg text-white placeholder:text-white/40 focus:outline-none focus:border-red-500"
                    placeholder="10"
                    required
                  />
                </div>
              </div>
              <div>
                <label className="block text-white/70 text-sm mb-2">Category</label>
                <select
                  value={newMerch.category}
                  onChange={(e) => setNewMerch({ ...newMerch, category: e.target.value })}
                  className="w-full px-4 py-3 bg-black/50 border border-white/10 rounded-lg text-white focus:outline-none focus:border-red-500"
                >
                  <option value="clothing">Clothing</option>
                  <option value="accessories">Accessories</option>
                  <option value="music">Music</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div>
                <label className="block text-white/70 text-sm mb-2">Sizes (comma separated)</label>
                <input
                  type="text"
                  value={newMerch.sizes.join(', ')}
                  onChange={(e) => setNewMerch({ ...newMerch, sizes: e.target.value.split(',').map(s => s.trim()).filter(Boolean) })}
                  className="w-full px-4 py-3 bg-black/50 border border-white/10 rounded-lg text-white placeholder:text-white/40 focus:outline-none focus:border-red-500"
                  placeholder="S, M, L, XL"
                />
              </div>
              <div>
                <label className="block text-white/70 text-sm mb-2">Image URL</label>
                <input
                  type="url"
                  value={newMerch.image}
                  onChange={(e) => setNewMerch({ ...newMerch, image: e.target.value })}
                  className="w-full px-4 py-3 bg-black/50 border border-white/10 rounded-lg text-white placeholder:text-white/40 focus:outline-none focus:border-red-500"
                  placeholder="https://..."
                />
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowAddMerch(false)}
                  className="flex-1 px-4 py-3 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-3 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors"
                >
                  Add Product
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </>
  )
}
