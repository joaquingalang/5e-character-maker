import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { signOut } from '@/app/actions/auth'

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('is_dm')
    .eq('id', user.id)
    .single()

  const isDM = profile?.is_dm ?? false

  return (
    <div className="min-h-full flex flex-col">
      <header className="border-b border-stone-800 bg-stone-950/80 backdrop-blur sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
          <Link href="/dashboard" className="text-amber-400 font-bold text-lg hover:text-amber-300 transition-colors">
            ⚔ Character Forge
          </Link>
          <div className="flex items-center gap-4">
            {isDM && (
              <Link href="/dm" className="text-purple-400 hover:text-purple-300 text-sm transition-colors">
                DM View
              </Link>
            )}
            <span className="text-stone-500 text-sm hidden sm:block">{user.email}</span>
            <form action={signOut}>
              <button
                type="submit"
                className="text-stone-400 hover:text-stone-200 text-sm border border-stone-700 hover:border-stone-500 px-3 py-1.5 rounded-lg transition-colors"
              >
                Sign out
              </button>
            </form>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-5xl w-full mx-auto px-4 py-8">
        {children}
      </main>
    </div>
  )
}
