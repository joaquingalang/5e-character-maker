import { createClient } from '@/lib/supabase/server'
import { createCharacter } from '@/app/actions/character'
import Link from 'next/link'
import type { Character } from '@/lib/types'
import { redirect } from 'next/navigation'

const STEP_LABELS = ['Race & Class', 'Your Story', 'Skills', 'Ability Scores', 'Equipment', 'Final Details']

async function CreateCharacterButton() {
  async function handleCreate() {
    'use server'
    const id = await createCharacter()
    redirect(`/characters/new/step/1?id=${id}`)
  }

  return (
    <form action={handleCreate}>
      <button
        type="submit"
        className="bg-amber-500 hover:bg-amber-400 text-stone-950 font-semibold px-6 py-3 rounded-lg transition-colors"
      >
        + Create New Character
      </button>
    </form>
  )
}

function CharacterCard({ character }: { character: Character }) {
  const stepLabel = STEP_LABELS[(character.current_step ?? 1) - 1] ?? 'Final Details'
  const displayName = character.name ?? 'Unnamed Draft'
  const subtitle = [character.race, character.class].filter(Boolean).join(' ') || 'No race or class yet'

  return (
    <div className="bg-stone-900 border border-stone-700 rounded-xl p-5 flex flex-col gap-4 hover:border-amber-500/40 transition-colors">
      <div className="flex items-start justify-between gap-2">
        <div>
          <h3 className="text-stone-100 font-semibold text-lg capitalize">{displayName}</h3>
          <p className="text-stone-400 text-sm capitalize">{subtitle}</p>
        </div>
        {character.completed ? (
          <span className="text-xs bg-amber-500/20 text-amber-400 border border-amber-500/30 px-2 py-1 rounded-full shrink-0">
            Complete
          </span>
        ) : (
          <span className="text-xs bg-stone-700 text-stone-400 px-2 py-1 rounded-full shrink-0">
            Step {character.current_step}/6
          </span>
        )}
      </div>

      {!character.completed && (
        <div className="space-y-1">
          <div className="flex justify-between text-xs text-stone-500 mb-1">
            <span>Progress</span>
            <span>{stepLabel}</span>
          </div>
          <div className="h-1.5 bg-stone-700 rounded-full overflow-hidden">
            <div
              className="h-full bg-amber-500 rounded-full transition-all"
              style={{ width: `${((character.current_step - 1) / 6) * 100}%` }}
            />
          </div>
        </div>
      )}

      <div className="flex gap-3 pt-1">
        {character.completed ? (
          <Link
            href={`/characters/${character.id}`}
            className="flex-1 text-center bg-amber-500 hover:bg-amber-400 text-stone-950 font-medium py-2 rounded-lg text-sm transition-colors"
          >
            View Character Sheet
          </Link>
        ) : (
          <Link
            href={`/characters/new/step/${character.current_step}?id=${character.id}`}
            className="flex-1 text-center bg-stone-700 hover:bg-stone-600 text-stone-100 font-medium py-2 rounded-lg text-sm transition-colors"
          >
            Continue →
          </Link>
        )}
      </div>
    </div>
  )
}

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: characters } = await supabase
    .from('characters')
    .select('*')
    .order('updated_at', { ascending: false })

  const list = (characters ?? []) as Character[]
  const drafts = list.filter(c => !c.completed)
  const completed = list.filter(c => c.completed)

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-stone-100">My Characters</h1>
          <p className="text-stone-400 mt-1">Your roster of heroes and adventurers</p>
        </div>
        <CreateCharacterButton />
      </div>

      {list.length === 0 && (
        <div className="text-center py-20 bg-stone-900 border border-stone-700 rounded-xl">
          <div className="text-5xl mb-4">🎲</div>
          <h2 className="text-xl font-semibold text-stone-200 mb-2">No characters yet</h2>
          <p className="text-stone-400 mb-6">Create your first character to begin your adventure!</p>
          <CreateCharacterButton />
        </div>
      )}

      {drafts.length > 0 && (
        <section className="mb-8">
          <h2 className="text-stone-400 text-sm font-semibold uppercase tracking-widest mb-4">In Progress</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {drafts.map(c => <CharacterCard key={c.id} character={c} />)}
          </div>
        </section>
      )}

      {completed.length > 0 && (
        <section>
          <h2 className="text-stone-400 text-sm font-semibold uppercase tracking-widest mb-4">Completed</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {completed.map(c => <CharacterCard key={c.id} character={c} />)}
          </div>
        </section>
      )}
    </div>
  )
}
