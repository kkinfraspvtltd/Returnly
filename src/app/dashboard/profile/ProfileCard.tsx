'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

type Profile = {
  full_name: string | null
  phone_number: string | null
  address: string | null
  reputation_score: number | null
}

export default function ProfileCard({ userId, email, profile }: { userId: string; email: string; profile: Profile }) {
  const router = useRouter()
  const [editing, setEditing] = useState(false)
  const [fullName, setFullName] = useState(profile.full_name ?? '')
  const [phoneNumber, setPhoneNumber] = useState(profile.phone_number ?? '')
  const [address, setAddress] = useState(profile.address ?? '')
  // Tracks what's actually been saved, independent of the (possibly
  // stale) server prop — this is what the read-only view displays
  const [saved, setSaved] = useState({
    fullName: profile.full_name ?? '',
    phoneNumber: profile.phone_number ?? '',
    address: profile.address ?? '',
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const initials = (saved.fullName || email || '?').trim().charAt(0).toUpperCase()
  const isIncomplete = !saved.fullName || !saved.phoneNumber || !saved.address

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError(null)
    const supabase = createClient()
    const { error: updateError } = await supabase
      .from('profiles')
      .update({ full_name: fullName, phone_number: phoneNumber, address })
      .eq('id', userId)
    setSaving(false)

    if (updateError) {
      setError(updateError.message)
      return
    }

    // Update what the view displays immediately, without waiting on
    // a round-trip refetch
    setSaved({ fullName, phoneNumber, address })
    setEditing(false)

    // Also resync the server-fetched tree, so anything else reading
    // this profile server-side (reputation score, other pages) is
    // current the next time it renders
    router.refresh()
  }

  return (
    <div className="tag-card mt-6 p-6 sm:p-8">
      {isIncomplete && !editing && (
        <p className="mb-4 rounded-2xl bg-[var(--color-alert-lost-soft)] p-3 text-sm font-bold text-[#7a3d0b]">
          Complete your profile so finders and Returnly can reach you reliably.
        </p>
      )}

      <div className="flex items-start gap-5">
        <div className="flex shrink-0 flex-col items-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[var(--color-primary-trust)]/15 text-2xl font-black text-[var(--color-primary-trust-dark)]">
            {initials}
          </div>
          <p className="mt-2 text-center text-xs font-black uppercase text-[var(--color-ink-muted)]">Score</p>
          <p className="font-display text-2xl font-semibold text-[#435f3d]">{profile.reputation_score ?? 0}</p>
        </div>

        <div className="min-w-0 flex-1">
          {editing ? (
            <form onSubmit={handleSave} className="space-y-3">
              <input value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Full name" className="input-field" required />
              <input value={phoneNumber} onChange={(e) => setPhoneNumber(e.target.value)} type="tel" placeholder="Phone number" className="input-field" required />
              <textarea value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Address" rows={2} className="input-field" required />
              {error && <p className="text-sm font-bold text-[#7a3d0b]">{error}</p>}
              <div className="flex gap-2">
                <button type="submit" disabled={saving} className="btn-primary px-4 py-2 text-sm">{saving ? 'Saving…' : 'Save'}</button>
                <button
                  type="button"
                  onClick={() => {
                    // Discard unsaved edits, revert inputs to last saved values
                    setFullName(saved.fullName)
                    setPhoneNumber(saved.phoneNumber)
                    setAddress(saved.address)
                    setEditing(false)
                  }}
                  className="rounded-full border border-[var(--color-line)] px-4 py-2 text-sm font-bold text-[var(--color-ink)]"
                >
                  Cancel
                </button>
              </div>
            </form>
          ) : (
            <div className="space-y-1.5">
              <div className="flex items-center justify-between gap-2">
                <h1 className="font-display truncate text-3xl font-semibold text-[var(--color-ink)]">{saved.fullName || 'Add your name'}</h1>
                <button type="button" onClick={() => setEditing(true)} aria-label="Edit profile" className="shrink-0 rounded-full border border-[var(--color-line)] bg-white/70 p-2 text-lg leading-none hover:bg-white">
                  ✎
                </button>
              </div>
              <p className="text-sm text-[var(--color-ink-muted)]">{email}</p>
              <p className="text-sm text-[var(--color-ink-muted)]">{saved.phoneNumber || 'No phone number added'}</p>
              <p className="text-sm text-[var(--color-ink-muted)]">{saved.address || 'No address added'}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
