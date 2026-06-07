'use client'

import { motion } from 'framer-motion'
import { Plus, Loader2, Shirt, Package } from 'lucide-react'
import Image from 'next/image'

interface PrintfulTabProps {
  printfulProducts: any[]
  printfulOrders: any[]
  printfulLoading: boolean
  printfulError: string
  syncPrintfulProducts: () => Promise<void>
}

export default function PrintfulTab({ printfulProducts, printfulOrders, printfulLoading, printfulError, syncPrintfulProducts }: PrintfulTabProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-4xl font-bold text-white">Printful</h1>
        <button
          type="button"
          onClick={syncPrintfulProducts}
          disabled={printfulLoading}
          className="flex items-center gap-2 px-4 py-2 bg-red-500 hover:bg-red-600 disabled:opacity-50 text-white rounded-lg transition-colors"
        >
          {printfulLoading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Plus className="w-4 h-4" />
          )}
          Sync Products
        </button>
      </div>
      {printfulError && (
        <p className="text-red-400 text-sm mb-4">{printfulError}</p>
      )}

      {/* Products */}
      <div className="mb-12">
        <h2 className="text-xl font-bold text-white mb-4">Products ({printfulProducts.length})</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {printfulProducts.map((product: any) => (
            <div key={product.id} className="bg-neutral-900/50 rounded-xl overflow-hidden border border-white/10">
              <div className="aspect-square bg-neutral-800 relative">
                {product.thumbnail_url ? (
                  <Image src={product.thumbnail_url} alt={product.name} fill className="object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Shirt className="w-12 h-12 text-white/20" />
                  </div>
                )}
              </div>
              <div className="p-4">
                <h3 className="text-sm font-semibold text-white truncate">{product.name}</h3>
                <p className="text-white/40 text-xs mt-1">ID: {product.id}</p>
              </div>
            </div>
          ))}
        </div>
        {printfulProducts.length === 0 && (
          <div className="text-center py-12 text-white/40">
            <Shirt className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>No Printful products synced yet</p>
          </div>
        )}
      </div>

      {/* Orders */}
      <div>
        <h2 className="text-xl font-bold text-white mb-4">Orders ({printfulOrders.length})</h2>
        <div className="bg-neutral-900/50 rounded-xl border border-white/10 overflow-hidden overflow-x-auto">
          <table className="w-full min-w-[500px]">
            <thead className="bg-black/30">
              <tr>
                <th className="text-left text-white/60 font-medium px-6 py-4">Order ID</th>
                <th className="text-left text-white/60 font-medium px-6 py-4">External ID</th>
                <th className="text-left text-white/60 font-medium px-6 py-4">Status</th>
                <th className="text-left text-white/60 font-medium px-6 py-4">Total</th>
              </tr>
            </thead>
            <tbody>
              {printfulOrders.map((order: any) => (
                <tr key={order.id} className="border-t border-white/10">
                  <td className="px-6 py-4 text-white font-medium">#{order.id}</td>
                  <td className="px-6 py-4 text-white/60">{order.external_id || '-'}</td>
                  <td className="px-6 py-4">
                    <span className={`px-3 py-1 rounded-full text-xs ${
                      order.status === 'pending' ? 'bg-yellow-500/20 text-yellow-500' :
                      order.status === 'fulfilled' ? 'bg-green-500/20 text-green-500' :
                      order.status === 'canceled' ? 'bg-red-500/20 text-red-500' :
                      'bg-white/10 text-white/60'
                    }`}>
                      {order.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-white/60">{order.total?.retail_price || '-'} {order.total?.currency || ''}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {printfulOrders.length === 0 && (
          <div className="text-center py-12 text-white/40">
            <Package className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>No Printful orders yet</p>
          </div>
        )}
      </div>
    </motion.div>
  )
}
