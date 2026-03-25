'use client'

import { useState } from 'react'
import { Gift, Star, Ticket, Shirt, ChevronRight } from 'lucide-react'

export default function RewardsPage() {
  const [points] = useState(150)
  const [tier] = useState('Silver')
  const [nextTier] = useState(350)
  const [rewards] = useState([
    { id: 1, name: 'Free Entry', points: 100, icon: Ticket, available: true },
    { id: 2, name: 'Merch Discount 20%', points: 200, icon: Shirt, available: false },
    { id: 3, name: 'VIP Upgrade', points: 500, icon: Star, available: false },
  ])

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">Rewards</h1>
        <p className="text-white/60">Earn points with every purchase</p>
      </div>

      {/* Points Card */}
      <div className="bg-gradient-to-r from-purple-500 to-pink-500 rounded-2xl p-8">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center">
              <Gift className="w-6 h-6 text-white" />
            </div>
            <div>
              <span className="text-white/80">Your Points</span>
              <p className="text-white/60 text-sm">{tier} Member</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-4xl font-bold text-white">{points}</p>
            <p className="text-white/60 text-sm">{nextTier - points} to Gold</p>
          </div>
        </div>
        
        {/* Progress Bar */}
        <div className="w-full bg-black/30 rounded-full h-3">
          <div 
            className="bg-white rounded-full h-3 transition-all"
            style={{ width: `${(points / (points + nextTier)) * 100}%` }}
          />
        </div>
      </div>

      {/* Available Rewards */}
      <div>
        <h2 className="text-xl font-bold text-white mb-4">Available Rewards</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {rewards.map((reward) => {
            const Icon = reward.icon
            return (
              <div 
                key={reward.id} 
                className={`p-6 rounded-xl border transition-all ${
                  reward.available 
                    ? 'bg-neutral-900 border-white/10 hover:border-red-500/50' 
                    : 'bg-neutral-900/50 border-white/5 opacity-50'
                }`}
              >
                <div className="w-12 h-12 bg-red-500/20 rounded-lg flex items-center justify-center mb-4">
                  <Icon className="w-6 h-6 text-red-500" />
                </div>
                <h3 className="text-white font-medium mb-2">{reward.name}</h3>
                <p className="text-white/60 text-sm mb-4">{reward.points} points</p>
                <button 
                  disabled={!reward.available}
                  className={`w-full py-2 rounded-lg font-medium transition-colors ${
                    reward.available
                      ? 'bg-red-500 hover:bg-red-600 text-white'
                      : 'bg-white/10 text-white/40 cursor-not-allowed'
                  }`}
                >
                  {reward.available ? 'Redeem' : 'Not enough points'}
                </button>
              </div>
            )
          })}
        </div>
      </div>

      {/* How to Earn */}
      <div className="bg-neutral-900 rounded-xl p-6 border border-white/10">
        <h2 className="text-xl font-bold text-white mb-4">How to Earn Points</h2>
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-black/30 rounded-lg">
            <div className="flex items-center gap-4">
              <Ticket className="w-6 h-6 text-red-500" />
              <div>
                <p className="text-white font-medium">Buy Event Tickets</p>
                <p className="text-white/60 text-sm">1 CHF spent = 1 point</p>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-white/40" />
          </div>
          <div className="flex items-center justify-between p-4 bg-black/30 rounded-lg">
            <div className="flex items-center gap-4">
              <Shirt className="w-6 h-6 text-red-500" />
              <div>
                <p className="text-white font-medium">Shop Merchandise</p>
                <p className="text-white/60 text-sm">1 CHF spent = 2 points</p>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-white/40" />
          </div>
        </div>
      </div>
    </div>
  )
}
