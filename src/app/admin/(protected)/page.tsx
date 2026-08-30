import AdminOrderRow from './AdminOrderRow'
import { createAdminClient } from '@/lib/supabase/admin'

export default async function AdminPage() {
  const supabase = createAdminClient()

  const { data: orders } = await supabase
    .from('qr_fulfillment_orders')
    .select('id,item_id,user_id,shipping_address,amount_charged,status,created_at')
    .order('created_at', { ascending: false })

  const itemIds = [...new Set((orders ?? []).map((o) => o.item_id))]
  const userIds = [...new Set((orders ?? []).map((o) => o.user_id))]

  const { data: items } = itemIds.length
    ? await supabase.from('items').select('id,title').in('id', itemIds)
    : { data: [] }

  const { data: profiles } = userIds.length
    ? await supabase.from('profiles').select('id,full_name,phone_number').in('id', userIds)
    : { data: [] }

  const itemTitleById = new Map((items ?? []).map((i) => [i.id, i.title]))
  const ownerById = new Map((profiles ?? []).map((p) => [p.id, p]))

  return (
    <main className="px-4 py-8">
      <div className="mx-auto max-w-5xl">
        <h1 className="font-display text-4xl font-semibold text-[var(--color-ink)]">QR fulfillment orders</h1>
        <p className="mt-2 text-[var(--color-ink-muted)]">{orders?.length ?? 0} total orders across all owners.</p>

        <div className="mt-6 space-y-3">
          {(orders ?? []).map((order) => {
            const owner = ownerById.get(order.user_id)
            return (
              <AdminOrderRow
                key={order.id}
                orderId={order.id}
                itemTitle={itemTitleById.get(order.item_id) ?? 'Item'}
                ownerName={owner?.full_name ?? 'Unknown'}
                ownerPhone={owner?.phone_number ?? 'No phone on file'}
                shippingAddress={order.shipping_address}
                amountCharged={order.amount_charged}
                status={order.status}
              />
            )
          })}
        </div>
      </div>
    </main>
  )
}