'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

type WalletCardProps = {
  userId: string
  walletBalance: number
  credits: number
  hasFinderBadge: boolean
}

export default function WalletCard({ userId, walletBalance, credits, hasFinderBadge }: WalletCardProps) {
  const [balance, setBalance] = useState(walletBalance)
  const [amount, setAmount] = useState('100')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleRecharge = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setMessage(null)

    const numericAmount = Number(amount)
    if (!numericAmount || numericAmount <= 0) {
      setError('Enter a valid amount.')
      return
    }

    setLoading(true)
    const supabase = createClient()
    const nextBalance = balance + numericAmount

    // TEST-ONLY: this credits the wallet directly with no payment
    // gateway involved. Before this handles real money, this must
    // become a server-side update triggered by a verified webhook
    // from a payment provider — never a client-writable balance.
    const { error: updateError } = await supabase
      .from('profiles')
      .update({ wallet_balance: nextBalance })
      .eq('id', userId)

    setLoading(false)

    if (updateError) {
      setError(updateError.message)
      return
    }

    setBalance(nextBalance)
    setMessage(`Added £${numericAmount} (test recharge — no real payment taken).`)
  }

  return (
    <div className="tag-card mt-6 p-6 sm:p-8">
      <p className="font-utility text-xs font-bold uppercase text-[var(--color-primary-trust-dark)]">Wallet</p>
      <p className="font-display mt-2 text-5xl font-semibold text-[var(--color-ink)]">£{balance}</p>
      <p className="mt-1 text-sm text-[var(--color-ink-muted)]">Used to order printed QR tags. Test mode — no real payment is processed.</p>

      <form onSubmit={handleRecharge} className="mt-4 flex flex-wrap items-end gap-3">
        <div>
          <label className="block text-sm font-bold text-[var(--color-ink)]">Recharge amount (£)</label>
          <input
            type="number"
            min="1"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="input-field mt-1 w-32"
          />
        </div>
        <button type="submit" disabled={loading} className="btn-primary px-5 py-3">
          {loading ? 'Processing…' : 'Recharge (test)'}
        </button>
      </form>

      {message && <p className="mt-3 text-sm font-bold text-[var(--color-primary-trust-dark)]">{message}</p>}
      {error && <p className="mt-3 text-sm font-bold text-[#7a3d0b]">{error}</p>}

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <div className="rounded-2xl border border-[var(--color-line)] bg-white/70 p-4">
          <p className="text-sm font-black text-[var(--color-ink-muted)]">Finder credits</p>
          <p className="mt-1 text-2xl font-black text-[var(--color-ink)]">{credits}</p>
          <p className="mt-1 text-xs text-[var(--color-ink-muted)]">Points earned for confirmed recoveries. No cash value.</p>
        </div>
        <div className="rounded-2xl border border-[var(--color-line)] bg-white/70 p-4">
          <p className="text-sm font-black text-[var(--color-ink-muted)]">Finder badge</p>
          <p className="mt-1 text-2xl font-black text-[var(--color-ink)]">{hasFinderBadge ? 'Earned' : 'Not yet earned'}</p>
        </div>
      </div>
    </div>
  )
}