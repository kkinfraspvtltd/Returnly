'use client'

import Link from 'next/link'
import { useMemo, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

type ItemDetail = {
  id: string
  title: string
  category: string | null
  description: string | null
  secret_identification_mark: string | null
  image_url: string | null
  qr_code_id: string
  is_lost: boolean
  reward_amount: number | null
  created_at: string
}

type ItemDetailClientProps = {
  item: ItemDetail
  fulfillmentStatus: string | null
}

const currencyFormatter = new Intl.NumberFormat('en-GB', {
  style: 'currency',
  currency: 'GBP',
  maximumFractionDigits: 0,
})

const fulfillmentStatusLabel: Record<string, string> = {
  pending_printing: 'Preparing to print',
  printed: 'Printed',
  shipped: 'Shipped',
  delivered: 'Delivered',
}

export default function ItemDetailClient({ item, fulfillmentStatus }: ItemDetailClientProps) {
  const [isLost, setIsLost] = useState(item.is_lost)
  const [rewardAmount, setRewardAmount] = useState(item.reward_amount?.toString() ?? '')
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const formattedReward = useMemo(() => {
    const numericReward = Number(rewardAmount)

    if (!isLost || !rewardAmount || Number.isNaN(numericReward) || numericReward <= 0) {
      return 'No reward set'
    }

    return `${currencyFormatter.format(numericReward)} reward`
  }, [isLost, rewardAmount])

  const updateLostSettings = async (nextIsLost: boolean, nextRewardAmount = rewardAmount) => {
    const supabase = createClient()
    const numericReward = nextRewardAmount ? Number(nextRewardAmount) : null

    // Minimum reward floor: if a reward is set at all, it must be ≥ £20.
    // Empty/zero is still allowed — no reward is a valid choice.
    if (nextIsLost && numericReward !== null && numericReward > 0 && numericReward < 20) {
      setError('Reward must be at least £20, or left empty for no reward.')
      return
    }

    const normalizedReward = nextIsLost && numericReward ? numericReward : null

    setSaving(true)
    setError(null)
    setMessage(null)

    const { error: updateError } = await supabase
      .from('items')
      .update({
        is_lost: nextIsLost,
        reward_amount: Number.isFinite(normalizedReward) ? normalizedReward : null,
      })
      .eq('id', item.id)

    setSaving(false)

    if (updateError) {
      setError(updateError.message)
      setIsLost(isLost)
      return
    }

    setMessage(nextIsLost ? 'Lost Mode is on. Finder scans now show recovery details.' : 'Item marked safe.')
  }

  const handleLostToggle = async () => {
    const nextIsLost = !isLost
    setIsLost(nextIsLost)
    await updateLostSettings(nextIsLost)
  }

  const handleRewardBlur = async () => {
    if (!isLost) {
      return
    }

    await updateLostSettings(true, rewardAmount)
  }

  return (
    <div className={`min-h-screen px-4 py-8 ${isLost ? 'lost-mode-page' : ''}`}>
      <article className={`tag-card mx-auto max-w-5xl p-5 sm:p-7 ${isLost ? 'tag-card-lost' : ''}`}>
        <Link href="/dashboard" className="mb-4 inline-block text-sm font-bold text-[var(--color-primary-trust-dark)] hover:underline">← Back to dashboard</Link>

        <div className="grid gap-8 lg:grid-cols-[1.05fr_0.95fr]">
          <section className="space-y-6 pr-0 sm:pr-8">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <span className={isLost ? 'status-pill status-lost' : 'status-pill status-safe'}>
                  {isLost ? '! Lost Mode Active' : '✓ Safe'}
                </span>
                <h1 className="font-display mt-4 text-4xl font-semibold text-[var(--color-ink)] sm:text-5xl">{item.title}</h1>
                {item.category && <p className="mt-2 text-[var(--color-ink-muted)]">{item.category}</p>}
              </div>
              <p className="font-utility rounded-full bg-white/70 px-3 py-2 text-xs text-[var(--color-ink-muted)]">{item.qr_code_id}</p>
            </div>

            <div className={`lost-mode-panel rounded-[1.25rem] border p-4 sm:p-5 ${isLost ? 'lost-mode-panel-on' : ''}`}>
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="text-xl font-extrabold text-[var(--color-ink)]">Lost Mode</h2>
                  <p className="mt-1 text-sm text-[var(--color-ink-muted)]">
                    This is the primary status for your physical tag. Turn it on when the item is missing.
                  </p>
                </div>
                <button
                  type="button"
                  aria-pressed={isLost}
                  disabled={saving}
                  onClick={handleLostToggle}
                  className={`lost-toggle ${isLost ? 'lost-toggle-on' : ''}`}
                >
                  <span className="lost-toggle-knob" />
                  <span>{isLost ? 'Lost' : 'Safe'}</span>
                </button>
              </div>

              {isLost && (
                <div className="mt-5 rounded-2xl bg-white/70 p-4">
                  <label className="block text-sm font-bold text-[var(--color-ink)]" htmlFor="reward">
                    Optional reward amount (min £20)
                  </label>
                  <div className="mt-2 flex items-center gap-3">
                    <span className="text-lg font-extrabold text-[#7a3d0b]">£</span>
                    <input
                      id="reward"
                      min="0"
                      step="1"
                      type="number"
                      value={rewardAmount}
                      onChange={(event) => setRewardAmount(event.target.value)}
                      onBlur={handleRewardBlur}
                      className="input-field"
                      placeholder="50"
                    />
                  </div>
                  <p className="mt-2 text-sm font-bold text-[#7a3d0b]">{formattedReward}</p>
                </div>
              )}

              {message && <p className="mt-4 text-sm font-bold text-[var(--color-primary-trust-dark)]">{message}</p>}
              {error && <p className="mt-4 rounded-xl bg-[var(--color-alert-lost-soft)] p-3 text-sm font-bold text-[#7a3d0b]">{error}</p>}
            </div>

            {item.image_url && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={item.image_url} alt={item.title} className="max-h-72 w-full rounded-3xl object-cover shadow-[var(--shadow-card)]" />
            )}

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-2xl border border-[var(--color-line)] bg-white/60 p-4">
                <h2 className="font-bold text-[var(--color-ink)]">Description</h2>
                <p className="mt-2 text-sm text-[var(--color-ink-muted)]">{item.description || 'No description added.'}</p>
              </div>
              <div className="rounded-2xl border border-[var(--color-line)] bg-white/60 p-4">
                <h2 className="font-bold text-[var(--color-ink)]">Private identification mark</h2>
                <p className="mt-2 text-sm text-[var(--color-ink-muted)]">{item.secret_identification_mark || 'No private mark added.'}</p>
              </div>
            </div>
          </section>

          <aside className="rounded-[1.35rem] border border-[var(--color-line)] bg-white/78 p-5 shadow-[var(--shadow-soft)]">
            <p className="status-pill status-safe">Tag ordered</p>
            <h2 className="font-display mt-4 text-3xl font-semibold text-[var(--color-ink)]">Physical QR tag</h2>
            <p className="mt-2 text-sm text-[var(--color-ink-muted)]">
              This is a soft-copy preview only — the printed tag is prepared and mailed by the Returnly QR Department.
            </p>

            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={`/api/generate-qr?text=${encodeURIComponent(`${process.env.NEXT_PUBLIC_SITE_URL}/item/${item.qr_code_id}`)}&width=280`}
              alt="Soft-copy preview of this item's QR tag — view only"
              className="mx-auto mt-4 w-40 rounded-2xl border border-[var(--color-line)] bg-white p-2 shadow-inner"
              draggable={false}
              onContextMenu={(e) => e.preventDefault()}
            />

            <div className="mt-4 rounded-2xl bg-[var(--color-base-bg)] p-4">
              <p className="text-xs font-bold uppercase text-[var(--color-ink-muted)]">Order status</p>
              <p className="mt-1 text-lg font-black text-[var(--color-ink)]">
                {fulfillmentStatus ? (fulfillmentStatusLabel[fulfillmentStatus] ?? fulfillmentStatus) : 'No order on file'}
              </p>
            </div>
            <p className="mt-3 break-all rounded-2xl bg-[var(--color-base-bg)] p-3 text-xs text-[var(--color-ink-muted)]">Reference code: {item.qr_code_id}</p>
          </aside>
        </div>
      </article>
    </div>
  )
}