import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import ProfileCard from './ProfileCard'
import WalletCard from './WalletCard'
import QrOrdersList from './QrOrdersList'

export default async function ProfilePage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name,phone_number,address,city,state_region,country,reputation_score,wallet_balance,credits,has_finder_badge')
    .eq('id', user!.id)
    .single()

  const { data: qrOrders } = await supabase
    .from('qr_fulfillment_orders')
    .select('id,status,amount_charged,created_at,items(title,qr_code_id)')
    .eq('user_id', user!.id)
    .order('created_at', { ascending: false })

  const fallbackProfile = {
    full_name: null,
    phone_number: null,
    address: null,
    city: null,
    state_region: null,
    country: null,
    reputation_score: 0,
    wallet_balance: 0,
    credits: 0,
    has_finder_badge: false,
  }

  return (
    <main className="px-4 py-8">
      <section className="mx-auto max-w-3xl">
        <Link href="/dashboard" className="text-sm font-bold text-[var(--color-primary-trust-dark)] hover:underline">← Back to dashboard</Link>

        <ProfileCard
          userId={user!.id}
          email={user!.email ?? ''}
          profile={profile ?? fallbackProfile}
        />

        <WalletCard
          userId={user!.id}
          walletBalance={profile?.wallet_balance ?? 0}
          credits={profile?.credits ?? 0}
          hasFinderBadge={profile?.has_finder_badge ?? false}
        />

        <QrOrdersList orders={qrOrders ?? []} />
      </section>
    </main>
  )
}
