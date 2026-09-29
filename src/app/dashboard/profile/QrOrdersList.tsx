'use client'

type QrOrder = {
  id: string
  status: string
  amount_charged: number
  created_at: string
  items: { title: string; qr_code_id: string } | { title: string; qr_code_id: string }[] | null
}

const statusLabel: Record<string, string> = {
  pending_printing: 'Preparing to print',
  printed: 'Printed',
  shipped: 'Shipped',
  delivered: 'Delivered',
}

function orderItem(order: QrOrder) {
  return Array.isArray(order.items) ? order.items[0] : order.items
}

export default function QrOrdersList({ orders }: { orders: QrOrder[] }) {
  if (orders.length === 0) {
    return null
  }

  return (
    <div className="tag-card mt-6 p-6 sm:p-8">
      <p className="font-utility text-xs font-bold uppercase text-[var(--color-primary-trust-dark)]">My QR tag orders</p>
      <h2 className="font-display mt-2 text-3xl font-semibold text-[var(--color-ink)]">Ordered tags</h2>

      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        {orders.map((order) => {
          const item = orderItem(order)
          if (!item) return null

          return (
            <div key={order.id} className="flex gap-4 rounded-2xl border border-[var(--color-line)] bg-white/70 p-4">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={`/api/generate-qr?text=${encodeURIComponent(`${process.env.NEXT_PUBLIC_SITE_URL}/item/${item.qr_code_id}`)}&width=160`}
                alt={`Soft-copy QR preview for ${item.title}`}
                className="h-16 w-16 shrink-0 rounded-xl border border-[var(--color-line)] bg-white p-1"
                draggable={false}
                onContextMenu={(e) => e.preventDefault()}
              />
              <div className="min-w-0">
                <p className="truncate text-sm font-black text-[var(--color-ink)]">{item.title}</p>
                <p className="mt-1 text-xs font-bold text-[var(--color-ink-muted)]">
                  {statusLabel[order.status] ?? order.status} · £{order.amount_charged}
                </p>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}