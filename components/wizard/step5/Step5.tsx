'use client'

import { useState, useTransition } from 'react'
import { saveStep5 } from '@/app/actions/character'
import type { Character, EquipmentItem } from '@/lib/types'
import type { ClassEquipment } from '@/lib/dnd-api'

interface Props {
  characterId: string
  initial: Partial<Character>
  classEquipment: ClassEquipment
}

export function Step5({ characterId, initial, classEquipment }: Props) {
  const [selections, setSelections] = useState<Record<number, number>>(() => {
    const saved = initial.equipment
    if (!saved?.length) return {}
    const savedIndices = new Set(saved.map(e => e.index))
    const result: Record<number, number> = {}
    classEquipment.choices.forEach((group, gi) => {
      group.options.forEach((opt, oi) => {
        if (opt.items.some(item => savedIndices.has(item.index))) result[gi] = oi
      })
    })
    return result
  })
  const [isPending, startTransition] = useTransition()

  const allChosen = classEquipment.choices.length === 0 ||
    classEquipment.choices.every((_, i) => i in selections)

  function handleNext() {
    const chosen: EquipmentItem[] = classEquipment.choices.flatMap((group, gi) => {
      const oi = selections[gi]
      return oi !== undefined ? group.options[oi].items : []
    })
    startTransition(() => saveStep5(characterId, [...classEquipment.guaranteed, ...chosen]))
  }

  return (
    <div className="space-y-8">
      <div>
        <p className="text-amber-500 text-xs font-semibold uppercase tracking-widest mb-1">Step 5 of 6</p>
        <h2 className="text-2xl font-bold text-stone-100">Starting Equipment</h2>
        <p className="text-stone-400 text-sm mt-1">
          Choose your starting gear. Your{' '}
          <span className="text-stone-200 capitalize">{initial.class}</span> determines what's available.
        </p>
      </div>

      {/* Guaranteed items */}
      {classEquipment.guaranteed.length > 0 && (
        <section>
          <p className="text-stone-400 text-xs font-semibold uppercase tracking-widest mb-3">
            Always included
          </p>
          <div className="flex flex-wrap gap-2">
            {classEquipment.guaranteed.map((item, i) => (
              <span
                key={i}
                className="bg-stone-800 border border-stone-700 text-stone-300 px-3 py-1.5 rounded-lg text-sm"
              >
                {item.quantity > 1 ? `${item.quantity}× ` : ''}{item.name}
              </span>
            ))}
          </div>
        </section>
      )}

      {classEquipment.guaranteed.length === 0 && classEquipment.choices.length === 0 && (
        <div className="text-center py-10 border border-dashed border-stone-700 rounded-xl text-stone-500 text-sm">
          No starting equipment data available for this class.
        </div>
      )}

      {/* Choice groups */}
      {classEquipment.choices.map((group, gi) => (
        <section key={gi}>
          <p className="text-stone-400 text-xs font-semibold uppercase tracking-widest mb-1">
            Choose one option
          </p>
          <p className="text-stone-500 text-xs italic mb-3">{group.desc}</p>
          <div className="space-y-2">
            {group.options.map((opt, oi) => {
              const selected = selections[gi] === oi
              return (
                <button
                  key={oi}
                  type="button"
                  onClick={() => setSelections(prev => ({ ...prev, [gi]: oi }))}
                  className={`w-full p-4 rounded-xl border-2 text-left transition-all ${
                    selected
                      ? 'border-amber-500 bg-amber-500/10'
                      : 'border-stone-700 bg-stone-900 hover:border-stone-500'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 transition-colors ${
                      selected
                        ? 'bg-amber-500 text-stone-950'
                        : 'bg-stone-700 text-stone-400'
                    }`}>
                      {String.fromCharCode(65 + oi)}
                    </span>
                    <span className={`text-sm ${selected ? 'text-stone-100' : 'text-stone-300'}`}>
                      {opt.label}
                    </span>
                    {selected && <span className="ml-auto text-amber-400 text-base shrink-0">✓</span>}
                  </div>
                </button>
              )
            })}
          </div>
        </section>
      ))}

      {/* Nav */}
      <div className="flex justify-between pt-4 border-t border-stone-800">
        <a
          href={`/characters/new/step/4?id=${characterId}`}
          className="px-6 py-3 border border-stone-600 hover:border-stone-400 text-stone-400 hover:text-stone-200 font-medium rounded-lg transition-colors"
        >
          ← Back
        </a>
        <button
          type="button"
          onClick={handleNext}
          disabled={!allChosen || isPending}
          className="px-8 py-3 bg-amber-500 hover:bg-amber-400 disabled:opacity-40 disabled:cursor-not-allowed text-stone-950 font-semibold rounded-lg transition-colors"
        >
          {isPending ? 'Saving…' : 'Next: Final Details →'}
        </button>
      </div>
    </div>
  )
}
