import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createAdminClient } from '@/lib/supabase/admin'

export async function POST(request: NextRequest) {
  const cookieStore = await cookies()
  const session = cookieStore.get('returnly_admin_session')?.value

  if (!session || session !== process.env.ADMIN_SESSION_SECRET) {
    return NextResponse.json({ error: 'Not authorized' }, { status: 401 })
  }

  const { orderId, status } = await request.json()
  const supabase = createAdminClient()

  const { error } = await supabase.from('qr_fulfillment_orders').update({ status }).eq('id', orderId)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}