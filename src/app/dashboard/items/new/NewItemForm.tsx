'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { nanoid } from 'nanoid'
import { createClient } from '@/lib/supabase/client'

type NewItemFormProps = {
  userId: string
  walletBalance: number
  ownerAddress: string
  qrFee: number
}

export default function NewItemForm({ userId, walletBalance, ownerAddress, qrFee }: NewItemFormProps) {
  const [title, setTitle] = useState('')
  const [category, setCategory] = useState('')
  const [description, setDescription] = useState('')
  const [secretMark, setSecretMark] = useState('')
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const router = useRouter()
  const hasSufficientBalance = walletBalance >= qrFee

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!hasSufficientBalance) {
      setError(`Insufficient wallet balance. This tag costs £${qrFee} — recharge in your profile first.`)
      return
    }

    setLoading(true)
    const supabase = createClient()

    let imageUrl: string | null = null
    if (imageFile) {
      const filePath = `${userId}/${nanoid()}-${imageFile.name}`
      const { error: uploadError } = await supabase.storage.from('item-images').upload(filePath, imageFile)
      if (uploadError) {
        setError(`Image upload failed: ${uploadError.message}`)
        setLoading(false)
        return
      }
      const {
        data: { publicUrl },
      } = supabase.storage.from('item-images').getPublicUrl(filePath)
      imageUrl = publicUrl
    }

    const qrCodeId = nanoid(10)

    // TEST-ONLY charge — see WalletCard.tsx for the same caveat.
    const { error: walletError } = await supabase
      .from('profiles')
      .update({ wallet_balance: walletBalance - qrFee })
      .eq('id', userId)

    if (walletError) {
      setError(`Payment failed: ${walletError.message}`)
      setLoading(false)
      return
    }

    const { data: newItem, error: insertError } = await supabase
      .from('items')
      .insert({
        user_id: userId,
        title,
        category,
        description,
        secret_identification_mark: secretMark,
        image_url: imageUrl,
        qr_code_id: qrCodeId,
      })
      .select()
      .single()

    if (insertError) {
      setError(insertError.message)
      setLoading(false)
      return
    }

    // This is what the future, separate QR Department app will read
    // from to actually print and mail the physical tag
    const { error: orderError } = await supabase
      .from('qr_fulfillment_orders')
      .insert({
        item_id: newItem.id,
        user_id: userId,
        shipping_address: ownerAddress,
        amount_charged: qrFee,
      })

    if (orderError) {
      // Item + payment already succeeded — don't block the owner on
      // this, but don't swallow it silently either
      console.error('Fulfillment order failed to create:', orderError.message)
    }

    router.push(`/dashboard/items/${newItem.id}`)
  }

  return (
    <div className="min-h-screen px-4 py-8">
      <form onSubmit={handleSubmit} className="tag-card mx-auto max-w-2xl space-y-6 p-6 sm:p-8">
        <div className="pr-10">
          <p className="font-utility text-xs font-bold uppercase text-[var(--color-primary-trust-dark)]">New physical tag</p>
          <h1 className="font-display mt-2 text-4xl font-semibold text-[var(--color-ink)] sm:text-5xl">Add a tagged item</h1>
          <p className="mt-3 text-[var(--color-ink-muted)]">Use the real item details that will help you recognize it later. Private fields stay owner-only.</p>
        </div>

        <div className={`rounded-2xl border p-4 ${hasSufficientBalance ? 'border-[var(--color-primary-trust)]/30 bg-[var(--color-primary-trust)]/8' : 'border-[var(--color-alert-lost)]/30 bg-[var(--color-alert-lost-soft)]'}`}>
          <p className="text-sm font-black text-[var(--color-ink)]">QR tag fee: £{qrFee}</p>
          <p className="mt-1 text-sm text-[var(--color-ink-muted)]">
            Wallet balance: £{walletBalance}. {hasSufficientBalance ? 'This will be charged when you save.' : `Recharge at least £${qrFee - walletBalance} more before continuing.`}
          </p>
        </div>

        {error && (
          <p className="rounded-xl bg-[var(--color-alert-lost-soft)] p-3 text-sm font-medium text-[#7a3d0b]">{error}</p>
        )}

        <div>
          <label className="block text-sm font-bold text-[var(--color-ink)]">Title</label>
          <input type="text" required value={title} onChange={(e) => setTitle(e.target.value)} className="input-field mt-1" placeholder="e.g. MacBook Pro" />
        </div>

        <div>
          <label className="block text-sm font-bold text-[var(--color-ink)]">Category</label>
          <input type="text" value={category} onChange={(e) => setCategory(e.target.value)} className="input-field mt-1" placeholder="e.g. Electronics" />
        </div>

        <div>
          <label className="block text-sm font-bold text-[var(--color-ink)]">Description</label>
          <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} className="input-field mt-1" />
        </div>

        <div>
          <label className="block text-sm font-bold text-[var(--color-ink)]">
            Secret identification mark <span className="text-[#7a3d0b]">(private — only you can see this)</span>
          </label>
          <p className="mb-1 text-xs text-[var(--color-ink-muted)]">Use this to verify a finder&apos;s claim without exposing the detail publicly.</p>
          <input type="text" value={secretMark} onChange={(e) => setSecretMark(e.target.value)} className="input-field mt-1" placeholder="e.g. small scratch near the logo" />
        </div>

        <div>
          <label className="block text-sm font-bold text-[var(--color-ink)]">Photo upload</label>
          <input type="file" accept="image/*" onChange={(e) => setImageFile(e.target.files?.[0] ?? null)} className="mt-1 w-full rounded-xl border border-[var(--color-line)] bg-white/70 p-3 text-sm" />
        </div>

        <button type="submit" disabled={loading || !hasSufficientBalance} className="btn-primary w-full px-4 py-3 disabled:opacity-50">
          {loading ? 'Processing payment…' : `Pay £${qrFee} and order tag`}
        </button>
      </form>
    </div>
  )
}