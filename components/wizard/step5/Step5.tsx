'use client'

import { useState, useTransition } from 'react'
import { saveStep5 } from '@/app/actions/character'
import type { Character, EquipmentItem } from '@/lib/types'
import type { ClassEquipment } from '@/lib/types'
import weaponsData from '@/lib/data/weapons.json'

type WeaponEntry = { index: string; name: string }
type WeaponsMap = Record<string, WeaponEntry[]>

function getWeaponsForCategory(category: string): WeaponEntry[] {
  const w = weaponsData as WeaponsMap
  if (category === 'simple-weapons') return [...(w['simple-melee-weapons'] ?? []), ...(w['simple-ranged-weapons'] ?? [])]
  if (category === 'martial-weapons') return [...(w['martial-melee-weapons'] ?? []), ...(w['martial-ranged-weapons'] ?? [])]
  return w[category] ?? []
}

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
  const [weaponSelections, setWeaponSelections] = useState<Record<number, string>>(() => {
    const saved = initial.equipment
    if (!saved?.length) return {}
    const result: Record<number, string> = {}
    classEquipment.choices.forEach((group, gi) => {
      const oi = selections[gi]
      if (oi === undefined) return
      const opt = group.options[oi]
      if (!opt?.weaponCategory) return
      const weapons = getWeaponsForCategory(opt.weaponCategory)
      const match = saved.find(e => weapons.some(w => w.index === e.index))
      if (match) result[gi] = match.index
    })
    return result
  })
  const [isPending, startTransition] = useTransition()

  const allChosen = classEquipment.choices.length === 0 ||
    classEquipment.choices.every((group, i) => {
      if (!(i in selections)) return false
      const opt = group.options[selections[i]]
      return !opt?.weaponCategory || i in weaponSelections
    })

  function handleNext() {
    const chosen: EquipmentItem[] = classEquipment.choices.flatMap((group, gi) => {
      const oi = selections[gi]
      if (oi === undefined) return []
      const opt = group.options[oi]
      if (opt.weaponCategory && weaponSelections[gi]) {
        const weapons = getWeaponsForCategory(opt.weaponCategory)
        const weapon = weapons.find(w => w.index === weaponSelections[gi])
        return weapon ? [{ index: weapon.index, name: weapon.name, quantity: 1 }] : opt.items
      }
      return opt.items
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
                <div key={oi} className="space-y-0">
                  <button
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
                      {selected && !opt.weaponCategory && <span className="ml-auto text-amber-400 text-base shrink-0">✓</span>}
                    </div>
                    {selected && opt.weaponCategory && (
                      <div className="mt-3 ml-9">
                        <p className="text-stone-500 text-xs mb-2">Choose a specific weapon:</p>
                        <div className="flex flex-wrap gap-2">
                          {getWeaponsForCategory(opt.weaponCategory).map(w => (
                            <button
                              key={w.index}
                              type="button"
                              onClick={e => { e.stopPropagation(); setWeaponSelections(prev => ({ ...prev, [gi]: w.index })) }}
                              className={`px-3 py-1.5 rounded-lg border text-xs transition-all ${
                                weaponSelections[gi] === w.index
                                  ? 'border-amber-500 bg-amber-500/10 text-amber-400'
                                  : 'border-stone-600 text-stone-400 hover:border-stone-400'
                              }`}
                            >
                              {w.name}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </button>
                </div>
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
