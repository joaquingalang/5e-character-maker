'use client'

import { useState, useTransition, useRef } from 'react'
import { saveStep4 } from '@/app/actions/character'
import type { Character, AbilityScores } from '@/lib/types'
import { CLASS_ABILITY_PRIORITIES, DEFAULT_PRIORITY } from '@/lib/constants/class-ability-priorities'

interface Props {
  characterId: string
  initial: Partial<Character>
}

type Method = 'standard_array' | 'point_buy' | 'rolled' | 'recommended'
type AbilityKey = keyof AbilityScores

const ABILITIES: { key: AbilityKey; label: string; abbr: string }[] = [
  { key: 'str', label: 'Strength', abbr: 'STR' },
  { key: 'dex', label: 'Dexterity', abbr: 'DEX' },
  { key: 'con', label: 'Constitution', abbr: 'CON' },
  { key: 'int', label: 'Intelligence', abbr: 'INT' },
  { key: 'wis', label: 'Wisdom', abbr: 'WIS' },
  { key: 'cha', label: 'Charisma', abbr: 'CHA' },
]

const STANDARD_ARRAY = [15, 14, 13, 12, 10, 8]

// Point buy costs: score → total points spent to reach that score from 8
const POINT_COSTS: Record<number, number> = { 8: 0, 9: 1, 10: 2, 11: 3, 12: 4, 13: 5, 14: 7, 15: 9 }
const POINT_BUDGET = 27

function modifier(score: number) {
  const mod = Math.floor((score - 10) / 2)
  return mod >= 0 ? `+${mod}` : `${mod}`
}

function roll4d6DropLowest(): { rolls: number[]; total: number } {
  const rolls = Array.from({ length: 4 }, () => Math.ceil(Math.random() * 6))
  rolls.sort((a, b) => a - b)
  const total = rolls.slice(1).reduce((a, b) => a + b, 0)
  return { rolls, total }
}

// Standard Array tab — drag-and-drop
function StandardArrayTab({
  scores,
  onChange,
}: {
  scores: AbilityScores
  onChange: (updated: AbilityScores) => void
}) {
  const [dropTarget, setDropTarget] = useState<AbilityKey | null>(null)
  // Track which value is being dragged and where it came from via refs (sync, no stale closure)
  const dragValRef = useRef<number | null>(null)
  const dragFromRef = useRef<'pool' | AbilityKey | null>(null)
  // Mirror in state only for re-render (highlighting the dragged chip)
  const [dragVal, setDragVal] = useState<number | null>(null)
  const [dragFrom, setDragFrom] = useState<'pool' | AbilityKey | null>(null)

  const assigned = Object.values(scores).filter(v => v > 0)
  const poolValues = STANDARD_ARRAY.filter(v => !assigned.includes(v))

  function startDrag(val: number, from: 'pool' | AbilityKey) {
    dragValRef.current = val
    dragFromRef.current = from
    setDragVal(val)
    setDragFrom(from)
  }

  function endDrag() {
    dragValRef.current = null
    dragFromRef.current = null
    setDragVal(null)
    setDragFrom(null)
    setDropTarget(null)
  }

  function handleDrop(targetKey: AbilityKey) {
    const val = dragValRef.current
    if (val === null) return
    const updated = { ...scores }
    // Unassign the dragged value from wherever it currently lives
    for (const k of Object.keys(updated) as AbilityKey[]) {
      if (updated[k] === val) updated[k] = 0
    }
    updated[targetKey] = val
    onChange(updated)
    endDrag()
  }

  function clearSlot(key: AbilityKey) {
    onChange({ ...scores, [key]: 0 })
  }

  const assignedCount = assigned.length

  return (
    <div className="space-y-5">
      <p className="text-stone-400 text-sm">
        Drag a score from the pool onto an ability slot to assign it.
        You can also drag between slots to swap.
      </p>

      {/* Score pool */}
      <div>
        <p className="text-stone-500 text-xs uppercase tracking-widest mb-2">Score Pool</p>
        <div className="flex flex-wrap gap-3 min-h-[60px] p-4 bg-stone-950 border border-stone-800 rounded-xl">
          {poolValues.length === 0 ? (
            <p className="text-stone-600 text-sm self-center italic">All scores assigned</p>
          ) : (
            poolValues.map(val => (
              <div
                key={val}
                draggable
                onDragStart={() => startDrag(val, 'pool')}
                onDragEnd={endDrag}
                className={`w-14 h-14 flex flex-col items-center justify-center rounded-xl border-2 border-amber-500/60 bg-amber-500/10 text-amber-400 font-bold text-xl cursor-grab active:cursor-grabbing select-none transition-opacity ${
                  dragFrom === 'pool' && dragVal === val ? 'opacity-40' : ''
                }`}
              >
                {val}
                <span className="text-amber-600 text-xs font-normal">{modifier(val)}</span>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Ability drop zones */}
      <div>
        <p className="text-stone-500 text-xs uppercase tracking-widest mb-2">
          Ability Scores — {assignedCount}/6 assigned
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {ABILITIES.map(ability => {
            const val = scores[ability.key]
            const isTarget = dropTarget === ability.key
            const isDraggingThis = dragFrom === ability.key

            return (
              <div
                key={ability.key}
                onDragOver={e => { e.preventDefault(); setDropTarget(ability.key) }}
                onDragLeave={() => setDropTarget(null)}
                onDrop={() => handleDrop(ability.key)}
                className={`flex items-center gap-4 rounded-xl p-3 border-2 transition-all ${
                  isTarget
                    ? 'border-amber-500 bg-amber-500/5'
                    : val
                    ? 'border-stone-700 bg-stone-900'
                    : 'border-dashed border-stone-700 bg-stone-900'
                }`}
              >
                {/* Score chip or empty zone */}
                <div className="w-14 shrink-0 flex items-center justify-center">
                  {val ? (
                    <div
                      draggable
                      onDragStart={() => startDrag(val, ability.key)}
                      onDragEnd={endDrag}
                      className={`relative w-12 h-12 flex flex-col items-center justify-center rounded-xl border-2 border-amber-500/60 bg-amber-500/10 cursor-grab active:cursor-grabbing select-none transition-opacity ${
                        isDraggingThis ? 'opacity-40' : ''
                      }`}
                    >
                      <span className="text-amber-400 font-bold text-lg leading-none">{val}</span>
                      <span className="text-amber-600 text-xs">{modifier(val)}</span>
                      <button
                        type="button"
                        onClick={() => clearSlot(ability.key)}
                        onMouseDown={e => e.stopPropagation()}
                        className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-stone-700 hover:bg-red-900/80 text-stone-400 hover:text-red-300 text-xs flex items-center justify-center leading-none transition-colors"
                        aria-label={`Unassign ${ability.label}`}
                      >
                        ×
                      </button>
                    </div>
                  ) : (
                    <div className={`w-12 h-12 rounded-xl border-2 border-dashed flex items-center justify-center text-sm font-bold transition-colors ${
                      isTarget ? 'border-amber-500 text-amber-500' : 'border-stone-700 text-stone-700'
                    }`}>
                      {isTarget ? '↓' : '–'}
                    </div>
                  )}
                </div>

                {/* Ability info */}
                <div className="flex-1">
                  <p className="text-stone-200 font-semibold">{ability.label}</p>
                  <p className="text-stone-600 text-xs">{ability.abbr}</p>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

// Point Buy tab
function PointBuyTab({
  scores,
  onChange,
}: {
  scores: AbilityScores
  onChange: (updated: AbilityScores) => void
}) {
  const spent = Object.values(scores).reduce((acc, v) => acc + (POINT_COSTS[v] ?? 0), 0)
  const remaining = POINT_BUDGET - spent

  function adjust(key: AbilityKey, delta: number) {
    const current = scores[key]
    const next = current + delta
    if (next < 8 || next > 15) return
    const newSpent = spent - POINT_COSTS[current] + POINT_COSTS[next]
    if (newSpent > POINT_BUDGET) return
    onChange({ ...scores, [key]: next })
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4 bg-stone-900 border border-stone-700 rounded-xl p-4">
        <div className="text-center">
          <p className="text-3xl font-bold text-amber-400">{remaining}</p>
          <p className="text-stone-500 text-xs">points left</p>
        </div>
        <div className="flex-1">
          <div className="h-2 bg-stone-700 rounded-full overflow-hidden">
            <div
              className="h-full bg-amber-500 rounded-full transition-all"
              style={{ width: `${(spent / POINT_BUDGET) * 100}%` }}
            />
          </div>
          <p className="text-stone-500 text-xs mt-1">Each ability starts at 8. Budget: {POINT_BUDGET} pts</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {ABILITIES.map(ability => (
          <div
            key={ability.key}
            className="flex items-center gap-3 bg-stone-900 border border-stone-700 rounded-xl p-3"
          >
            <div className="w-10 text-center shrink-0">
              <p className="text-stone-100 font-bold text-xl">{scores[ability.key]}</p>
              <p className="text-stone-500 text-xs">{modifier(scores[ability.key])}</p>
            </div>
            <div className="flex-1">
              <p className="text-stone-300 text-sm font-medium">{ability.label}</p>
              <p className="text-stone-600 text-xs">Cost: {POINT_COSTS[scores[ability.key]]} pts</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => adjust(ability.key, -1)}
                disabled={scores[ability.key] <= 8}
                className="w-8 h-8 rounded-lg border border-stone-600 text-stone-300 hover:border-stone-400 disabled:opacity-30 disabled:cursor-not-allowed text-lg flex items-center justify-center"
              >
                −
              </button>
              <button
                type="button"
                onClick={() => adjust(ability.key, 1)}
                disabled={scores[ability.key] >= 15 || remaining < (POINT_COSTS[scores[ability.key] + 1] ?? 999) - POINT_COSTS[scores[ability.key]]}
                className="w-8 h-8 rounded-lg border border-stone-600 text-stone-300 hover:border-stone-400 disabled:opacity-30 disabled:cursor-not-allowed text-lg flex items-center justify-center"
              >
                +
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// Dice Roll tab
function DiceRollTab({
  scores,
  onChange,
}: {
  scores: AbilityScores
  onChange: (updated: AbilityScores) => void
}) {
  const [rolls, setRolls] = useState<Record<AbilityKey, { dice: number[]; total: number } | null>>(
    () => Object.fromEntries(ABILITIES.map(a => [a.key, null])) as Record<AbilityKey, null>
  )

  function rollAll() {
    const newRolls: Record<AbilityKey, { dice: number[]; total: number }> = {} as never
    const newScores: AbilityScores = {} as never
    for (const ability of ABILITIES) {
      const result = roll4d6DropLowest()
      newRolls[ability.key] = { dice: result.rolls, total: result.total }
      newScores[ability.key] = result.total
    }
    setRolls(newRolls)
    onChange(newScores)
  }

  function rollOne(key: AbilityKey) {
    const result = roll4d6DropLowest()
    setRolls(prev => ({ ...prev, [key]: { dice: result.rolls, total: result.total } }))
    onChange({ ...scores, [key]: result.total })
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-stone-400 text-sm">Roll 4d6, drop the lowest die for each ability score.</p>
        <button
          type="button"
          onClick={rollAll}
          className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-stone-950 font-semibold rounded-lg text-sm transition-colors"
        >
          🎲 Roll All
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {ABILITIES.map(ability => {
          const roll = rolls[ability.key]
          return (
            <div
              key={ability.key}
              className="flex items-center gap-3 bg-stone-900 border border-stone-700 rounded-xl p-3"
            >
              <div className="w-10 text-center shrink-0">
                <p className={`font-bold text-xl ${roll ? 'text-stone-100' : 'text-stone-600'}`}>
                  {roll ? roll.total : '?'}
                </p>
                <p className="text-stone-500 text-xs">{roll ? modifier(roll.total) : ''}</p>
              </div>
              <div className="flex-1">
                <p className="text-stone-300 text-sm font-medium">{ability.label}</p>
                {roll && (
                  <div className="flex gap-1 mt-0.5">
                    {roll.dice.map((d, i) => (
                      <span
                        key={i}
                        className={`text-xs px-1.5 py-0.5 rounded ${
                          i === 0
                            ? 'text-stone-600 line-through'
                            : 'text-stone-400 bg-stone-800'
                        }`}
                      >
                        {d}
                      </span>
                    ))}
                  </div>
                )}
              </div>
              <button
                type="button"
                onClick={() => rollOne(ability.key)}
                className="px-3 py-1.5 border border-stone-600 hover:border-amber-500/50 text-stone-400 hover:text-amber-400 rounded-lg text-xs transition-colors"
              >
                🎲 Re-roll
              </button>
            </div>
          )
        })}
      </div>
    </div>
  )
}

const PRIORITY_LABELS = ['Primary', 'Secondary', 'Tertiary', 'Quaternary', 'Quinary', 'Dump Stat']

function buildRecommendedScores(className: string | null | undefined): AbilityScores {
  const priority = (className && CLASS_ABILITY_PRIORITIES[className]) ?? DEFAULT_PRIORITY
  const scores: AbilityScores = { str: 0, dex: 0, con: 0, int: 0, wis: 0, cha: 0 }
  STANDARD_ARRAY.forEach((val, i) => { scores[priority[i]] = val })
  return scores
}

// Recommended tab — read-only, auto-assigned by class priority
function RecommendedTab({
  scores,
  className,
}: {
  scores: AbilityScores
  className: string | null | undefined
}) {
  const priority = (className && CLASS_ABILITY_PRIORITIES[className]) ?? DEFAULT_PRIORITY
  const displayName = className
    ? className.charAt(0).toUpperCase() + className.slice(1)
    : 'your class'

  return (
    <div className="space-y-5">
      <p className="text-stone-400 text-sm">
        Scores from the Standard Array are automatically assigned based on common{' '}
        <span className="text-amber-400 font-medium">{displayName}</span> priorities.
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {priority.map((key, i) => {
          const ability = ABILITIES.find(a => a.key === key)!
          const val = scores[key]
          const label = PRIORITY_LABELS[i]
          const isDump = i === 5

          return (
            <div
              key={key}
              className="flex items-center gap-4 rounded-xl p-3 border border-stone-700 bg-stone-900"
            >
              <div className="w-14 shrink-0 flex flex-col items-center justify-center h-12 rounded-xl border-2 border-amber-500/60 bg-amber-500/10">
                <span className="text-amber-400 font-bold text-lg leading-none">{val}</span>
                <span className="text-amber-600 text-xs">{modifier(val)}</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-stone-200 font-semibold">{ability.label}</p>
                <p className="text-stone-600 text-xs">{ability.abbr}</p>
              </div>
              <span className={`text-xs font-medium px-2 py-0.5 rounded-full shrink-0 ${
                isDump
                  ? 'bg-stone-800 text-stone-500'
                  : i === 0
                  ? 'bg-amber-500/20 text-amber-400'
                  : 'bg-stone-800 text-stone-400'
              }`}>
                {label}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// Main Step4 component
export function Step4({ characterId, initial }: Props) {
  const [method, setMethod] = useState<Method>(
    (initial.ability_score_method as Method) ?? 'recommended'
  )
  const [scores, setScores] = useState<AbilityScores>(() => {
    if (initial.ability_scores) return initial.ability_scores
    if (!initial.ability_score_method || initial.ability_score_method === 'recommended') {
      return buildRecommendedScores(initial.class)
    }
    if (initial.ability_score_method === 'point_buy') {
      return { str: 8, dex: 8, con: 8, int: 8, wis: 8, cha: 8 }
    }
    return { str: 0, dex: 0, con: 0, int: 0, wis: 0, cha: 0 }
  })
  const [isPending, startTransition] = useTransition()

  function initScoresForMethod(m: Method) {
    if (m === 'point_buy') setScores({ str: 8, dex: 8, con: 8, int: 8, wis: 8, cha: 8 })
    else if (m === 'recommended') setScores(buildRecommendedScores(initial.class))
    else setScores({ str: 0, dex: 0, con: 0, int: 0, wis: 0, cha: 0 })
    setMethod(m)
  }

  const allFilled = Object.values(scores).every(v => v > 0)
  const canProceed = allFilled

  function handleNext() {
    startTransition(() => saveStep4(characterId, { ability_scores: scores, ability_score_method: method }))
  }

  const TABS: { key: Method; label: string; desc: string }[] = [
    { key: 'recommended', label: 'Recommended', desc: 'Auto-assigns scores to the best stats for your class' },
    { key: 'standard_array', label: 'Standard Array', desc: 'Assign preset scores: 15, 14, 13, 12, 10, 8' },
    { key: 'point_buy', label: 'Point Buy', desc: 'Spend 27 points to customise each score (8–15)' },
    { key: 'rolled', label: 'Roll Dice', desc: 'Roll 4d6 and drop the lowest for each ability' },
  ]

  return (
    <div className="space-y-8">
      <div>
        <p className="text-amber-500 text-xs font-semibold uppercase tracking-widest mb-1">Step 4 of 6</p>
        <h2 className="text-2xl font-bold text-stone-100">Ability Scores</h2>
        <p className="text-stone-400 text-sm mt-1">
          Your six core abilities define your physical and mental capabilities. Choose your preferred method below.
        </p>
      </div>

      {/* Method tabs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {TABS.map(tab => (
          <button
            key={tab.key}
            type="button"
            onClick={() => initScoresForMethod(tab.key)}
            className={`p-4 rounded-xl border-2 text-left transition-all ${
              method === tab.key
                ? 'border-amber-500 bg-amber-500/10'
                : 'border-stone-700 bg-stone-900 hover:border-stone-500'
            }`}
          >
            <p className={`font-semibold text-sm ${method === tab.key ? 'text-amber-400' : 'text-stone-200'}`}>
              {tab.label}
            </p>
            <p className="text-stone-500 text-xs mt-1 leading-snug">{tab.desc}</p>
          </button>
        ))}
      </div>

      {/* Active method UI */}
      <div>
        {method === 'recommended' && (
          <RecommendedTab scores={scores} className={initial.class} />
        )}
        {method === 'standard_array' && (
          <StandardArrayTab scores={scores} onChange={setScores} />
        )}
        {method === 'point_buy' && (
          <PointBuyTab scores={scores} onChange={setScores} />
        )}
        {method === 'rolled' && (
          <DiceRollTab scores={scores} onChange={setScores} />
        )}
      </div>

      {/* Nav */}
      <div className="flex justify-between pt-4 border-t border-stone-800">
        <a
          href={`/characters/new/step/3?id=${characterId}`}
          className="px-6 py-3 border border-stone-600 hover:border-stone-400 text-stone-400 hover:text-stone-200 font-medium rounded-lg transition-colors"
        >
          ← Back
        </a>
        <button
          type="button"
          onClick={handleNext}
          disabled={!canProceed || isPending}
          className="px-8 py-3 bg-amber-500 hover:bg-amber-400 disabled:opacity-40 disabled:cursor-not-allowed text-stone-950 font-semibold rounded-lg transition-colors"
        >
          {isPending ? 'Saving…' : 'Next: Equipment →'}
        </button>
      </div>
    </div>
  )
}
