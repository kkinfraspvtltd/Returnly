import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const cookieStore = await cookies()
  const session = cookieStore.get('returnly_admin_session')?.value

  if (!session || session !== process.env.ADMIN_SESSION_SECRET) {
    redirect('/admin/login')
  }

  return (
    <div className="min-h-screen bg-[var(--color-base-bg)]">
      <header className="flex items-center justify-between border-b border-[var(--color-line)] bg-white/80 px-4 py-4">
        <p className="font-display text-2xl font-semibold text-[var(--color-ink)]">Returnly Admin</p>
        <form action="/api/admin-logout" method="post">
          <button type="submit" formAction="/api/admin-logout" className="rounded-full border border-[var(--color-line)] px-4 py-2 text-sm font-bold text-[var(--color-ink)]">
            Log out
          </button>
        </form>
      </header>
      {children}
    </div>
  )
}