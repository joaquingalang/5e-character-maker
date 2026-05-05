import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import type { Character, Profile } from '@/lib/types'

export default async function DMPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: currentProfile } = await supabase
    .from('profiles')
    .select('is_dm')
    .eq('id', user.id)
    .single()

  if (!currentProfile?.is_dm) redirect('/dashboard')

  const [{ data: profiles }, { data: characters }] = await Promise.all([
    supabase.from('profiles').select('id, email, is_dm').order('email'),
    supabase.from('characters').select('*').order('created_at', { ascending: false }),
  ])

  const charactersByUser = (characters ?? []).reduce<Record<string, Character[]>>((acc, char) => {
    if (!acc[char.user_id]) acc[char.user_id] = []
    acc[char.user_id].push(char)
    return acc
  }, {})

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-amber-400 mb-1">DM View</h1>
        <p className="text-stone-500 text-sm">{(profiles ?? []).length} accounts</p>
      </div>

      <div className="space-y-4">
        {(profiles ?? []).map((profile: Profile) => {
          const userChars = charactersByUser[profile.id] ?? []
          return (
            <div key={profile.id} className="border border-stone-800 rounded-xl bg-stone-900/50 p-5">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-stone-200 text-sm font-medium">{profile.email ?? 'Unknown'}</span>
                {profile.is_dm && (
                  <span className="text-xs bg-purple-900/60 text-purple-300 border border-purple-700/50 px-2 py-0.5 rounded-full">
                    DM
                  </span>
                )}
                <span className="text-stone-600 text-xs ml-auto">
                  {userChars.length} {userChars.length === 1 ? 'character' : 'characters'}
                </span>
              </div>

              {userChars.length === 0 ? (
                <p className="text-stone-600 text-sm italic">No characters yet.</p>
              ) : (
                <div className="space-y-2">
                  {userChars.map((char: Character) => (
                    <div key={char.id} className="flex items-center gap-3 text-sm">
                      <div className="flex-1 min-w-0">
                        <span className="text-stone-300 font-medium">
                          {char.name ?? <span className="italic text-stone-600">Unnamed</span>}
                        </span>
                        {(char.race || char.class) && (
                          <span className="text-stone-500 ml-2">
                            {[char.race, char.class].filter(Boolean).join(' ')}
                            {char.level ? ` (Level ${char.level})` : ''}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        {char.completed ? (
                          <span className="text-xs text-emerald-400 bg-emerald-900/30 border border-emerald-800/50 px-2 py-0.5 rounded-full">
                            Complete
                          </span>
                        ) : (
                          <span className="text-xs text-stone-500 bg-stone-800/50 border border-stone-700/50 px-2 py-0.5 rounded-full">
                            Step {char.current_step}/6
                          </span>
                        )}
                        {char.completed && (
                          <Link
                            href={`/characters/${char.id}`}
                            className="text-xs text-amber-500 hover:text-amber-400 transition-colors"
                          >
                            View
                          </Link>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
