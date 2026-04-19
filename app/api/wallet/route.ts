import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { getCurrentUser } from '@/lib/auth'
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''



// GET /api/wallet - Get wallet balance and transactions
export async function GET() {
  try {
    const user = getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey)
    
    // Get or create wallet
    let { data: wallet } = await supabase
      .from('user_wallets')
      .select('*')
      .eq('user_id', user.id)
      .single()
    
    if (!wallet) {
      const { data: newWallet, error: createError } = await supabase
        .from('user_wallets')
        .insert({ user_id: user.id, balance: 0 })
        .select()
        .single()
      
      if (createError) {
        return NextResponse.json({ error: createError.message }, { status: 500 })
      }
      wallet = newWallet
    }
    
    // Get recent transactions
    const { data: transactions, error: txError } = await supabase
      .from('wallet_transactions')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(20)

    if (txError) {
      return NextResponse.json({ error: txError.message }, { status: 500 })
    }

    return NextResponse.json({
      wallet: wallet || { balance: 0, currency: 'CHF' },
      transactions: transactions || []
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// POST /api/wallet - Add funds or withdraw
export async function POST(request: NextRequest) {
  try {
    const user = getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const body = await request.json()
    const { amount, type, method, description } = body

    if (!amount || !type) {
      return NextResponse.json({ error: 'Amount and type required' }, { status: 400 })
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey)
    
    // Get current wallet
    let { data: wallet } = await supabase
      .from('user_wallets')
      .select('*')
      .eq('user_id', user.id)
      .single()
    
    if (!wallet) {
      const { data: newWallet } = await supabase
        .from('user_wallets')
        .insert({ user_id: user.id, balance: 0 })
        .select()
        .single()
      wallet = newWallet
    }

    // Create transaction record
    const { data: transaction, error: txError } = await supabase
      .from('wallet_transactions')
      .insert({
        user_id: user.id,
        amount: type === 'withdrawal' ? -Math.abs(amount) : Math.abs(amount),
        type,
        method: method || 'manual',
        description: description || '',
        status: 'pending',
        metadata: { ...body }
      })
      .select()
      .single()

    if (txError) {
      return NextResponse.json({ error: txError.message }, { status: 500 })
    }

    // If it's a deposit, update balance immediately (or mark as pending for bank transfers)
    if (type === 'deposit' && method !== 'bank_transfer') {
      const newBalance = (wallet?.balance || 0) + Math.abs(amount)
      
      await supabase
        .from('user_wallets')
        .update({ balance: newBalance, updated_at: new Date().toISOString() })
        .eq('user_id', user.id)
      
      await supabase
        .from('wallet_transactions')
        .update({ status: 'completed' })
        .eq('id', transaction.id)
      
      return NextResponse.json({
        success: true,
        transaction: { ...transaction, status: 'completed' },
        newBalance
      })
    }

    return NextResponse.json({
      success: true,
      transaction,
      message: 'Transaction pending approval'
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
