import { createClient } from '@/lib/supabase/server'
import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { PHB_BACKGROUNDS } from '@/lib/constants/backgrounds'
import { ALL_SKILLS } from '@/lib/constants/class-skills'
import type { Character, AbilityScores, EquipmentItem } from '@/lib/types'

interface Props {
  params: Promise<{ id: string }>
}

function modifier(score: number) {
  const mod = Math.floor((score - 10) / 2)
  return mod >= 0 ? `+${mod}` : `${mod}`
}

const ABILITY_KEYS: Array<{ key: keyof AbilityScores; label: string; abbr: string }> = [
  { key: 'str', label: 'Strength', abbr: 'STR' },
  { key: 'dex', label: 'Dexterity', abbr: 'DEX' },
  { key: 'con', label: 'Constitution', abbr: 'CON' },
  { key: 'int', label: 'Intelligence', abbr: 'INT' },
  { key: 'wis', label: 'Wisdom', abbr: 'WIS' },
  { key: 'cha', label: 'Charisma', abbr: 'CHA' },
]

const SKILL_ABILITY_MAP: Record<string, keyof AbilityScores> = {
  acrobatics: 'dex', 'animal-handling': 'wis', arcana: 'int', athletics: 'str',
  deception: 'cha', history: 'int', insight: 'wis', intimidation: 'cha',
  investigation: 'int', medicine: 'wis', nature: 'int', perception: 'wis',
  performance: 'cha', persuasion: 'cha', religion: 'int', 'sleight-of-hand': 'dex',
  stealth: 'dex', survival: 'wis',
}

export default async function CharacterSheetPage({ params }: Props) {
  const { id } = await params
  const supabase = await createClient()

  const { data: character } = await supabase
    .from('characters')
    .select('*')
    .eq('id', id)
    .single()

  if (!character) notFound()
  if (!character.completed) redirect(`/characters/new/step/${character.current_step}?id=${id}`)

  const char = character as Character
  const scores = char.ability_scores as AbilityScores
  const skills = char.skills ?? []
  const equipment = (char.equipment ?? []) as EquipmentItem[]
  const background = PHB_BACKGROUNDS.find(b => b.index === char.background)
  const level = char.level ?? 1
  const PROF_BONUS = Math.ceil(level / 4) + 1

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="bg-stone-900 border border-stone-700 rounded-2xl p-8">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-amber-500 text-xs font-semibold uppercase tracking-widest mb-2">Character Sheet</p>
            <h1 className="text-4xl font-bold text-stone-100 capitalize">{char.name}</h1>
            <p className="text-stone-400 mt-2 capitalize">
              {char.subrace ?? char.race}{' '}
              {char.subclass ? `${char.class} (${char.subclass})` : char.class}
              {char.background && background ? ` · ${background.name}` : ''}
              {char.alignment ? ` · ${char.alignment}` : ''}
            </p>
          </div>
          <div className="text-center bg-stone-800 rounded-xl px-4 py-3 shrink-0">
            <p className="text-3xl font-bold text-amber-400">{level}</p>
            <p className="text-stone-500 text-xs">Level</p>
          </div>
        </div>
      </div>

      {/* Ability Scores */}
      <section>
        <h2 className="text-stone-400 text-xs font-semibold uppercase tracking-widest mb-3">Ability Scores</h2>
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
          {ABILITY_KEYS.map(({ key, abbr }) => (
            <div
              key={key}
              className="bg-stone-900 border border-stone-700 rounded-xl p-3 text-center"
            >
              <p className="text-stone-500 text-xs font-semibold mb-1">{abbr}</p>
              <p className="text-stone-100 text-2xl font-bold">{scores?.[key] ?? '–'}</p>
              <p className="text-amber-400 text-sm font-semibold">
                {scores ? modifier(scores[key]) : ''}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Combat Stats */}
      <section>
        <h2 className="text-stone-400 text-xs font-semibold uppercase tracking-widest mb-3">Combat</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="bg-stone-900 border border-stone-700 rounded-xl p-4 text-center">
            <p className="text-stone-500 text-xs mb-1">Proficiency Bonus</p>
            <p className="text-stone-100 text-2xl font-bold">+{PROF_BONUS}</p>
          </div>
          <div className="bg-stone-900 border border-stone-700 rounded-xl p-4 text-center">
            <p className="text-stone-500 text-xs mb-1">Initiative</p>
            <p className="text-stone-100 text-2xl font-bold">
              {scores ? modifier(scores.dex) : '–'}
            </p>
          </div>
          <div className="bg-stone-900 border border-stone-700 rounded-xl p-4 text-center">
            <p className="text-stone-500 text-xs mb-1">Passive Perception</p>
            <p className="text-stone-100 text-2xl font-bold">
              {scores
                ? 10 + Math.floor((scores.wis - 10) / 2) + (skills.includes('perception') ? PROF_BONUS : 0)
                : '–'}
            </p>
          </div>
          <div className="bg-stone-900 border border-stone-700 rounded-xl p-4 text-center">
            <p className="text-stone-500 text-xs mb-1">Speed</p>
            <p className="text-stone-100 text-2xl font-bold">30 ft</p>
          </div>
        </div>
      </section>

      {/* Skills */}
      {skills.length > 0 && scores && (
        <section>
          <h2 className="text-stone-400 text-xs font-semibold uppercase tracking-widest mb-3">Skills</h2>
          <div className="bg-stone-900 border border-stone-700 rounded-xl divide-y divide-stone-800">
            {ALL_SKILLS.map(skill => {
              const isProficient = skills.includes(skill.index)
              const abilityKey = SKILL_ABILITY_MAP[skill.index]
              const base = abilityKey ? Math.floor((scores[abilityKey] - 10) / 2) : 0
              const bonus = base + (isProficient ? PROF_BONUS : 0)
              const bonusStr = bonus >= 0 ? `+${bonus}` : `${bonus}`

              return (
                <div
                  key={skill.index}
                  className={`flex items-center justify-between px-4 py-2.5 ${
                    isProficient ? 'opacity-100' : 'opacity-40'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <div
                      className={`w-2 h-2 rounded-full ${
                        isProficient ? 'bg-amber-500' : 'bg-stone-700'
                      }`}
                    />
                    <span className={`text-sm ${isProficient ? 'text-stone-200' : 'text-stone-500'}`}>
                      {skill.name}
                    </span>
                    <span className="text-stone-600 text-xs">({skill.ability})</span>
                  </div>
                  <span className={`text-sm font-mono font-semibold ${isProficient ? 'text-amber-400' : 'text-stone-600'}`}>
                    {bonusStr}
                  </span>
                </div>
              )
            })}
          </div>
        </section>
      )}

      {/* Equipment */}
      {equipment.length > 0 && (
        <section>
          <h2 className="text-stone-400 text-xs font-semibold uppercase tracking-widest mb-3">Starting Equipment</h2>
          <div className="bg-stone-900 border border-stone-700 rounded-xl p-4">
            <div className="flex flex-wrap gap-2">
              {equipment.map((item, i) => (
                <span
                  key={i}
                  className="bg-stone-800 border border-stone-700 text-stone-300 px-3 py-1.5 rounded-lg text-sm"
                >
                  {item.quantity > 1 ? `${item.quantity}× ` : ''}{item.name}
                </span>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Background & Backstory */}
      <section className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {background && (
          <div className="bg-stone-900 border border-stone-700 rounded-xl p-5">
            <h2 className="text-stone-400 text-xs font-semibold uppercase tracking-widest mb-3">Background</h2>
            <p className="text-stone-100 font-semibold mb-1">{background.name}</p>
            <p className="text-stone-400 text-sm mb-3">{background.description}</p>
            <p className="text-amber-400 text-xs font-semibold uppercase tracking-wide mb-1">Feature</p>
            <p className="text-stone-300 text-sm font-medium">{background.feature_name}</p>
            <p className="text-stone-500 text-xs mt-1">{background.feature_desc}</p>
          </div>
        )}

        {(char.backstory || char.goal) && (
          <div className="bg-stone-900 border border-stone-700 rounded-xl p-5">
            <h2 className="text-stone-400 text-xs font-semibold uppercase tracking-widest mb-3">Story</h2>
            {char.backstory && (
              <>
                <p className="text-amber-400 text-xs font-semibold uppercase tracking-wide mb-1">Backstory</p>
                <p className="text-stone-300 text-sm leading-relaxed mb-4">{char.backstory}</p>
              </>
            )}
            {char.goal && (
              <>
                <p className="text-amber-400 text-xs font-semibold uppercase tracking-wide mb-1">Current Goal</p>
                <p className="text-stone-300 text-sm leading-relaxed">{char.goal}</p>
              </>
            )}
          </div>
        )}
      </section>

      {/* Back link */}
      <div className="pt-2 pb-8">
        <Link
          href="/dashboard"
          className="text-amber-400 hover:text-amber-300 text-sm flex items-center gap-1"
        >
          ← Back to My Characters
        </Link>
      </div>
    </div>
  )
}
