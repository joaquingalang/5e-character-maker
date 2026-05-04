'use client'

import { useState, useTransition } from 'react'
import { saveStep6 } from '@/app/actions/character'
import { PHB_BACKGROUNDS } from '@/lib/constants/backgrounds'
import { ALL_SKILLS } from '@/lib/constants/class-skills'
import type { Character, AbilityScores } from '@/lib/types'

interface Props {
  characterId: string
  initial: Partial<Character>
}

const ALIGNMENTS = [
  ['Lawful Good', 'Neutral Good', 'Chaotic Good'],
  ['Lawful Neutral', 'True Neutral', 'Chaotic Neutral'],
  ['Lawful Evil', 'Neutral Evil', 'Chaotic Evil'],
]

function modifier(score: number) {
  const mod = Math.floor((score - 10) / 2)
  return mod >= 0 ? `+${mod}` : `${mod}`
}

function SummaryRow({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <div className="flex justify-between py-2 border-b border-stone-800 last:border-0">
      <span className="text-stone-500 text-sm">{label}</span>
      <span className="text-stone-200 text-sm font-medium capitalize">{value ?? '—'}</span>
    </div>
  )
}

export function Step6({ characterId, initial }: Props) {
  const [name, setName] = useState(initial.name ?? '')
  const [alignment, setAlignment] = useState(initial.alignment ?? '')
  const [isPending, startTransition] = useTransition()

  const canProceed = name.trim().length >= 1

  const background = PHB_BACKGROUNDS.find(b => b.index === initial.background)
  const scores = initial.ability_scores as AbilityScores | null
  const skills = initial.skills ?? []
  const equipment = initial.equipment ?? []

  const ABILITY_KEYS: Array<{ key: keyof AbilityScores; label: string }> = [
    { key: 'str', label: 'STR' },
    { key: 'dex', label: 'DEX' },
    { key: 'con', label: 'CON' },
    { key: 'int', label: 'INT' },
    { key: 'wis', label: 'WIS' },
    { key: 'cha', label: 'CHA' },
  ]

  function handleCreate() {
    startTransition(() =>
      saveStep6(characterId, { name: name.trim(), alignment: alignment || null })
    )
  }

  return (
    <div className="space-y-8">
      <div>
        <p className="text-amber-500 text-xs font-semibold uppercase tracking-widest mb-1">Step 6 of 6</p>
        <h2 className="text-2xl font-bold text-stone-100">Final Details</h2>
        <p className="text-stone-400 text-sm mt-1">
          Almost there! Give your character a name, then review everything before creating them.
        </p>
      </div>

      {/* Name input */}
      <div>
        <label className="block text-stone-300 font-medium mb-2" htmlFor="char-name">
          Character Name <span className="text-red-400">*</span>
        </label>
        <input
          id="char-name"
          type="text"
          required
          value={name}
          onChange={e => setName(e.target.value)}
          placeholder="e.g. Thorn Ironfist, Lady Sylvara, Kazimir the Grey…"
          className="w-full bg-stone-900 border border-stone-600 rounded-xl px-4 py-3 text-stone-100 placeholder-stone-600 focus:outline-none focus:border-amber-500 transition-colors text-lg"
        />
      </div>

      {/* Alignment picker */}
      <div>
        <p className="text-stone-300 font-medium mb-3">
          Alignment <span className="text-stone-500 font-normal text-sm">(optional)</span>
        </p>
        <div className="grid grid-cols-3 gap-2">
          {ALIGNMENTS.flat().map(al => (
            <button
              key={al}
              type="button"
              onClick={() => setAlignment(prev => (prev === al ? '' : al))}
              className={`py-2.5 rounded-xl border text-sm transition-all ${
                alignment === al
                  ? 'border-amber-500 bg-amber-500/10 text-amber-400 font-medium'
                  : 'border-stone-700 text-stone-400 hover:border-stone-500 hover:text-stone-200'
              }`}
            >
              {al}
            </button>
          ))}
        </div>
      </div>

      {/* Summary */}
      <div className="bg-stone-900 border border-stone-700 rounded-xl p-5">
        <h3 className="text-stone-200 font-semibold mb-4">Character Summary</h3>

        <SummaryRow label="Level" value={String(initial.level ?? 1)} />
        <SummaryRow label="Race" value={`${initial.race ?? ''}${initial.subrace ? ` (${initial.subrace})` : ''}`} />
        <SummaryRow label="Class" value={`${initial.class ?? ''}${initial.subclass ? ` – ${initial.subclass}` : ''}`} />
        <SummaryRow label="Background" value={background?.name} />

        {/* Ability scores */}
        {scores && (
          <div className="py-3 border-b border-stone-800">
            <p className="text-stone-500 text-sm mb-2">Ability Scores</p>
            <div className="grid grid-cols-6 gap-2 text-center">
              {ABILITY_KEYS.map(({ key, label }) => (
                <div key={key} className="bg-stone-800 rounded-lg p-2">
                  <p className="text-stone-100 font-bold">{scores[key]}</p>
                  <p className="text-amber-400 text-xs">{modifier(scores[key])}</p>
                  <p className="text-stone-600 text-xs">{label}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Skills */}
        {skills.length > 0 && (
          <div className="py-3 border-b border-stone-800">
            <p className="text-stone-500 text-sm mb-2">Skills</p>
            <div className="flex flex-wrap gap-1">
              {skills.map(s => {
                const skill = ALL_SKILLS.find(sk => sk.index === s)
                return (
                  <span key={s} className="text-xs bg-stone-800 text-stone-300 px-2 py-1 rounded-full capitalize">
                    {skill?.name ?? s.replace(/-/g, ' ')}
                  </span>
                )
              })}
            </div>
          </div>
        )}

        {/* Equipment */}
        {equipment.length > 0 && (
          <div className="pt-3">
            <p className="text-stone-500 text-sm mb-2">Starting Equipment</p>
            <div className="flex flex-wrap gap-1">
              {equipment.map((item, i) => (
                <span key={i} className="text-xs bg-stone-800 text-stone-300 px-2 py-1 rounded-full">
                  {item.quantity > 1 ? `${item.quantity}× ` : ''}{item.name}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Nav */}
      <div className="flex justify-between pt-4 border-t border-stone-800">
        <a
          href={`/characters/new/step/5?id=${characterId}`}
          className="px-6 py-3 border border-stone-600 hover:border-stone-400 text-stone-400 hover:text-stone-200 font-medium rounded-lg transition-colors"
        >
          ← Back
        </a>
        <button
          type="button"
          onClick={handleCreate}
          disabled={!canProceed || isPending}
          className="px-8 py-3 bg-amber-500 hover:bg-amber-400 disabled:opacity-40 disabled:cursor-not-allowed text-stone-950 font-bold rounded-lg transition-colors"
        >
          {isPending ? 'Creating…' : '🎲 Create My Character!'}
        </button>
      </div>
    </div>
  )
}
