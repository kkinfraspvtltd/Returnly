'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

const statusOptions = ['pending_printing', 'printed', 'shipped', 'delivered'] as const

const statusLabel: Record<string, string> = {
  pending_printing: 'Pending printing',
  printed: 'Printed',
  shipped: 'Shipped',
  delivered: 'Delivered',
}

type AdminOrderRowProps = {
  orderId: string
  itemTitle: string
  ownerName: string
  ownerPhone: string
  shippingAddress: string
  amountCharged: number
  status: string
}

export default function AdminOrderRow({
  orderId,
  itemTitle,
  ownerName,
  ownerPhone,
  shippingAddress,
  amountCharged,
  status,
}: AdminOrderRowProps) {
  const [currentStatus, setCurrentStatus] = useState(status)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleStatusChange(newStatus: string) {
    setSaving(true)
    setError(null)

    const response = await fetch('/api/admin-update-order-status', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ orderId, status: newStatus }),
    })

    setSaving(false)

    if (!response.ok) {
      const body = await response.json().catch(() => ({}))
      setError(body.error ?? 'Update failed.')
      return
    }
    setCurrentStatus(newStatus)
  }

  return (
    <div className="tag-card p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="font-black text-[var(--color-ink)]">{itemTitle}</p>
          <p className="mt-1 text-sm text-[var(--color-ink-muted)]">{ownerName} · {ownerPhone}</p>
          <p className="mt-1 text-sm text-[var(--color-ink-muted)]">{shippingAddress}</p>
          <p className="mt-1 text-xs font-bold text-[var(--color-ink-muted)]">₹{amountCharged} charged</p>
        </div>

        <div className="text-right">
          <select
            value={currentStatus}
            onChange={(e) => handleStatusChange(e.target.value)}
            disabled={saving}
            className="rounded-full border border-[var(--color-line)] bg-white px-4 py-2 text-sm font-bold text-[var(--color-ink)]"
          >
            {statusOptions.map((option) => (
              <option key={option} value={option}>{statusLabel[option]}</option>
            ))}
          </select>
          {error && <p className="mt-2 text-xs font-bold text-[#7a3d0b]">{error}</p>}
        </div>
      </div>
    </div>
  )
}