import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

type PublicItem = {
  user_id: string
  title: string
  category: string
  description: string | null
  image_url: string | null
  is_lost: boolean
  reward_amount: number | null
}

const rewardFormatter = new Intl.NumberFormat('en-GB', {
  style: 'currency',
  currency: 'GBP',
  maximumFractionDigits: 0,
})

function ItemPhoto({ item }: { item: PublicItem }) {
  if (item.image_url) {
    return (
      <img
        src={item.image_url}
        alt={item.title}
        className="h-full min-h-56 w-full rounded-[1.35rem] object-cover shadow-[var(--shadow-card)]"
      />
    )
  }

  return (
    <div className="flex min-h-56 items-center justify-center rounded-[1.35rem] border border-[var(--color-line)] bg-white/78 p-8 text-center shadow-inner">
      <div>
        <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-3xl bg-[var(--color-primary-trust)]/12 text-4xl" aria-hidden="true">
          ◇
        </div>
        <p className="text-lg font-extrabold text-[var(--color-ink)]">{item.category}</p>
      </div>
    </div>
  )
}

function SafeState() {
  return (
    <main className="min-h-screen px-4 py-5 sm:py-8">
      <section className="mx-auto flex min-h-[calc(100vh-2.5rem)] w-full max-w-md flex-col justify-center">
        <div className="rounded-[1.75rem] border border-[var(--color-primary-trust)]/25 bg-[var(--color-surface-raised)] p-6 text-center shadow-[var(--shadow-card)] sm:p-8">
          <div className="mx-auto mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-[var(--color-primary-trust)]/12 text-5xl text-[var(--color-primary-trust-dark)]" aria-hidden="true">
            ✓
          </div>
          <p className="status-pill status-safe mx-auto mb-5 w-fit">Scan worked</p>
          <h1 className="font-display text-5xl font-semibold leading-[0.95] tracking-tight text-[var(--color-ink)]">
            This item is safe.
          </h1>
          <p className="mt-5 text-xl font-semibold leading-8 text-[var(--color-ink)]">
            It is already with its owner. Nothing else is needed.
          </p>
          <p className="mt-5 text-base leading-7 text-[var(--color-ink-muted)]">
            Thanks for checking the Returnly tag — your scan confirmed the tag is active.
          </p>
        </div>
      </section>
    </main>
  )
}

function LostState({ item, qrId, ownerName }: { item: PublicItem; qrId: string; ownerName: string }) {
  const reward = item.reward_amount && item.reward_amount > 0
    ? rewardFormatter.format(item.reward_amount)
    : null

  return (
    <main className="lost-mode-page min-h-screen px-4 py-4 sm:py-8">
      <section className="mx-auto flex min-h-[calc(100vh-2rem)] w-full max-w-md flex-col justify-center gap-4">
        <div className="rounded-[1.75rem] border border-[var(--color-line)] bg-[var(--color-surface-raised)] p-5 shadow-[var(--shadow-card)] sm:p-6">
          <div className="mb-5 flex items-center justify-between gap-3">
            <p className="status-pill status-lost">Lost item</p>
            {reward && (
              <p className="rounded-full bg-[var(--color-alert-lost-soft)] px-4 py-2 text-sm font-black text-[#7a3d0b] ring-1 ring-[var(--color-alert-lost)]/25">
                {reward} reward
              </p>
            )}
          </div>

          <div className="space-y-4">
            <ItemPhoto item={item} />
            <div>
              <p className="font-utility text-xs font-bold uppercase text-[var(--color-ink-muted)]">{item.category}</p>
              <h1 className="font-display mt-2 text-5xl font-semibold leading-[0.95] tracking-tight text-[var(--color-ink)]">
                {item.title}
              </h1>
              <p className="mt-3 text-lg font-bold leading-7 text-[var(--color-ink)]">
                This {item.title.toLowerCase()} belongs to {ownerName}.
                {reward ? ` Take a ${reward} reward and help return it.` : ' Help return it to its owner.'}
              </p>
              {item.description && (
                <p className="mt-4 text-lg font-medium leading-7 text-[var(--color-ink)]">
                  {item.description}
                </p>
              )}
            </div>
          </div>
        </div>

        <div className="rounded-[1.75rem] border border-[var(--color-line)] bg-white/78 p-4 shadow-[var(--shadow-card)]">
          <h2 className="px-1 text-2xl font-black leading-8 text-[var(--color-ink)]">Help return it</h2>
          <p className="mt-1 px-1 text-base font-semibold leading-6 text-[var(--color-ink-muted)]">
            Choose either path. Both protect your privacy and the owner’s.
          </p>
          <div className="mt-4 space-y-3">
            <Link
              href={`/login?next=${encodeURIComponent(`/item/${qrId}/contact`)}`}
              className="btn-primary block w-full px-5 py-4 text-center text-lg"
            >
              Log in / Sign up to message the owner
            </Link>
            <Link
              href={`/item/${qrId}/guest`}
              className="block text-center text-sm font-bold text-[var(--color-ink-muted)] hover:underline"
            >
              Continue as guest instead →
            </Link>
          </div>
        </div>
      </section>
    </main>
  )
}

export default async function PublicItemPage({
  params,
}: {
  params: Promise<{ qr_id: string }>
}) {
  const { qr_id: qrId } = await params
  const supabase = await createClient()

  const { data: item, error } = await supabase
    .from('items_public')
    .select('user_id,title,category,description,image_url,is_lost,reward_amount')
    .eq('qr_code_id', qrId)
    .single()

  if (error || !item) {
    notFound()
  }

  if (!item.is_lost) {
    return <SafeState />
  }

  // Only fetch the owner's name when actually needed (lost state) —
  // no reason to spend a query on the safe path
  const { data: owner } = await supabase
    .from('profiles_public')
    .select('full_name')
    .eq('id', item.user_id)
    .single()

  return <LostState item={item} qrId={qrId} ownerName={owner?.full_name || 'the owner'} />
}