'use client'

import { useState, useEffect } from 'react'
import { Gift, Star, Ticket, Shirt, LogIn, Loader2, Check, History } from 'lucide-react'

interface Reward {
  id: string
  name: string
  description: string
  points_cost: number
  reward_type: string
}

interface Redemption {
  id: string
  code: string
  points_used: number
  status: string
  created_at: string
  rewards: { name: string }
}

export default function RewardsPage() {
  const [loading, setLoading] = useState(true)
  const [redeeming, setRedeeming] = useState<string | null>(null)
  const [points, setPoints] = useState(0)
  const [lifetimePoints, setLifetimePoints] = useState(0)
  const [tier, setTier] = useState('Bronze')
  const [nextTier, setNextTier] = useState<any>(null)
  const [availableRewards, setAvailableRewards] = useState<Reward[]>([])
  const [allRewards, setAllRewards] = useState<Reward[]>([])
  const [history, setHistory] = useState<Redemption[]>([])
  const [message, setMessage] = useState<{type: 'success' | 'error', text: string} | null>(null)

  useEffect(() => {
    loadRewards()
  }, [])

  const loadRewards = async () => {
    try {
      const res = await fetch('/api/rewards')
      if (res.ok) {
        const data = await res.json()
        setPoints(data.points)
        setLifetimePoints(data.lifetimePoints)
        setTier(data.tier)
        setNextTier(data.nextTier)
        setAvailableRewards(data.availableRewards || [])
        setAllRewards(data.allRewards || [])
        setHistory(data.history || [])
      }
    } catch (error) {
      console.error('Error loading rewards:', error)
    } finally {
      setLoading(false)
    }
  }

  const redeemReward = async (rewardId: string) => {
    setRedeeming(rewardId)
    setMessage(null)
    
    try {
      const res = await fetch('/api/rewards', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reward_id: rewardId })
      })

      const data = await res.json()

      if (res.ok) {
        setMessage({ type: 'success', text: `Reward redeemed! Code: ${data.redemption.code}` })
        await loadRewards()
      } else {
        setMessage({ type: 'error', text: data.error || 'Failed to redeem reward' })
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'An error occurred' })
    } finally {
      setRedeeming(null)
    }
  }

  const getRewardIcon = (type: string) => {
    switch (type) {
      case 'free_ticket': return Ticket
      case 'discount': return Star
      case 'merchandise': return Shirt
      default: return Gift
    }
  }

  const progressToNextTier = nextTier 
    ? ((lifetimePoints - (nextTier.min - (nextTier.min - lifetimePoints))) / nextTier.min) * 100
    : 100

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 text-red-500 animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">Rewards</h1>
        <p className="text-white/60">Earn points with every purchase</p>
      </div>

      {/* Message */}
      {message && (
        <div className={`p-4 rounded-lg ${message.type === 'success' ? 'bg-green-500/20 text-green-500' : 'bg-red-500/20 text-red-500'}`}>
          {message.text}
        </div>
      )}

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
            {nextTier && (
              <p className="text-white/60 text-sm">{nextTier.min - lifetimePoints} to {nextTier.name}</p>
            )}
          </div>
        </div>
        
        {/* Progress Bar */}
        <div className="w-full bg-black/30 rounded-full h-3">
          <div 
            className="bg-white rounded-full h-3 transition-all"
            style={{ width: `${Math.min(progressToNextTier, 100)}%` }}
          />
        </div>
        
        {/* Multiplier Badge */}
        <div className="mt-4 flex items-center gap-2">
          <span className="px-3 py-1 bg-white/20 rounded-full text-white text-sm">
            {tier === 'Bronze' && '1x Points'}
            {tier === 'Silver' && '1.2x Points'}
            {tier === 'Gold' && '1.5x Points'}
            {tier === 'Platinum' && '2x Points'}
          </span>
        </div>
      </div>

      {/* Available Rewards */}
      <div>
        <h2 className="text-xl font-bold text-white mb-4">Available Rewards</h2>
        {allRewards.length === 0 ? (
          <p className="text-white/60">No rewards available at the moment.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {allRewards.map((reward) => {
              const Icon = getRewardIcon(reward.reward_type)
              const canAfford = points >= reward.points_cost
              
              return (
                <div 
                  key={reward.id} 
                  className={`p-6 rounded-xl border transition-all ${
                    canAfford 
                      ? 'bg-neutral-900 border-white/10 hover:border-red-500/50' 
                      : 'bg-neutral-900/50 border-white/5 opacity-50'
                  }`}
                >
                  <div className="w-12 h-12 bg-red-500/20 rounded-lg flex items-center justify-center mb-4">
                    <Icon className="w-6 h-6 text-red-500" />
                  </div>
                  <h3 className="text-white font-medium mb-1">{reward.name}</h3>
                  <p className="text-white/60 text-sm mb-4">{reward.description}</p>
                  <p className="text-red-500 font-bold mb-4">{reward.points_cost} points</p>
                  <button 
                    onClick={() => canAfford && redeemReward(reward.id)}
                    disabled={!canAfford || redeeming === reward.id}
                    className={`w-full py-2 rounded-lg font-medium transition-colors ${
                      canAfford
                        ? 'bg-red-500 hover:bg-red-600 text-white'
                        : 'bg-white/10 text-white/40 cursor-not-allowed'
                    }`}
                  >
                    {redeeming === reward.id ? (
                      <Loader2 className="w-4 h-4 animate-spin mx-auto" />
                    ) : canAfford ? (
                      'Redeem'
                    ) : (
                      'Not enough points'
                    )}
                  </button>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Redemption History */}
      {history.length > 0 && (
        <div className="bg-neutral-900 rounded-xl p-6 border border-white/10">
          <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
            <History className="w-5 h-5 text-red-500" />
            Your Redemptions
          </h2>
          <div className="space-y-3">
            {history.map((item) => (
              <div key={item.id} className="flex items-center justify-between p-4 bg-black/30 rounded-lg">
                <div>
                  <p className="text-white font-medium">{item.rewards.name}</p>
                  <p className="text-white/60 text-sm">Code: <span className="font-mono text-red-500">{item.code}</span></p>
                </div>
                <div className="text-right">
                  <p className="text-white/60 text-sm">{item.points_used} points</p>
                  <span className={`text-xs px-2 py-1 rounded ${
                    item.status === 'active' ? 'bg-green-500/20 text-green-500' : 'bg-white/10 text-white/60'
                  }`}>
                    {item.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* How to Earn */}
      <div className="bg-neutral-900 rounded-xl p-6 border border-white/10">
        <h2 className="text-xl font-bold text-white mb-4">How to Earn Points</h2>
        <div className="space-y-4">
          <div className="flex items-center p-4 bg-black/30 rounded-lg">
            <div className="flex items-center gap-4">
              <Ticket className="w-6 h-6 text-red-500" />
              <div>
                <p className="text-white font-medium">Buy Event Tickets</p>
                <p className="text-white/60 text-sm">1 CHF spent = 1 point</p>
              </div>
            </div>
          </div>
          <div className="flex items-center p-4 bg-black/30 rounded-lg">
            <div className="flex items-center gap-4">
              <Shirt className="w-6 h-6 text-red-500" />
              <div>
                <p className="text-white font-medium">Shop Merchandise</p>
                <p className="text-white/60 text-sm">1 CHF spent = 2 points</p>
              </div>
            </div>
          </div>
          <div className="flex items-center p-4 bg-black/30 rounded-lg">
            <div className="flex items-center gap-4">
              <LogIn className="w-6 h-6 text-red-500" />
              <div>
                <p className="text-white font-medium">Daily Login</p>
                <p className="text-white/60 text-sm">10 points per day</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
