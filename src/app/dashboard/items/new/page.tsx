import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import NewItemForm from './NewItemForm'

const QR_ISSUANCE_FEE = 49 // £49 test fee — adjust freely, this is not tied to anything external

export default async function NewItemPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name,phone_number,address,wallet_balance')
    .eq('id', user!.id)
    .single()

  const isProfileIncomplete = !profile?.full_name || !profile?.phone_number || !profile?.address

  if (isProfileIncomplete) {
    return (
      <div className="px-4 py-8">
        <div className="tag-card mx-auto max-w-2xl p-6 sm:p-8">
          <p className="font-utility text-xs font-bold uppercase text-[var(--color-primary-trust-dark)]">Profile required</p>
          <h1 className="font-display mt-2 text-4xl font-semibold text-[var(--color-ink)]">Complete your profile first</h1>
          <p className="mt-3 text-[var(--color-ink-muted)]">
            Your address is needed so the Returnly QR Department can mail your printed tag once payment is complete.
          </p>
          <Link href="/dashboard/profile" className="btn-primary mt-5 inline-block px-5 py-3">
            Complete profile
          </Link>
        </div>
      </div>
    )
  }

  return (
    <NewItemForm
      userId={user!.id}
      walletBalance={profile.wallet_balance}
      ownerAddress={profile.address ?? ''}
      qrFee={QR_ISSUANCE_FEE}
    />
  )
}