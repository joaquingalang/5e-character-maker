'use client'

import { useState, useTransition } from 'react'
import { saveStep1 } from '@/app/actions/character'
import { RACE_DESCRIPTIONS, CLASS_DESCRIPTIONS } from '@/lib/constants/class-skills'
import type { Character, DnDRaceListItem, DnDClassListItem, DnDSubclassListItem } from '@/lib/types'

interface Props {
  characterId: string
  races: DnDRaceListItem[]
  classes: DnDClassListItem[]
  initial: Partial<Character>
}

function SectionTitle({ step, title, subtitle }: { step: string; title: string; subtitle: string }) {
  return (
    <div className="mb-5">
      <p className="text-amber-500 text-xs font-semibold uppercase tracking-widest mb-1">{step}</p>
      <h2 className="text-2xl font-bold text-stone-100">{title}</h2>
      <p className="text-stone-400 text-sm mt-1">{subtitle}</p>
    </div>
  )
}

function profBonus(level: number) {
  return Math.ceil(level / 4) + 1
}

export function Step1({ characterId, races, classes, initial }: Props) {
  const [selectedRace, setSelectedRace] = useState(initial.race ?? '')
  const [selectedSubrace, setSelectedSubrace] = useState(initial.subrace ?? '')
  const [selectedClass, setSelectedClass] = useState(initial.class ?? '')
  const [selectedSubclass, setSelectedSubclass] = useState(initial.subclass ?? '')
  const [level, setLevel] = useState(initial.level ?? 1)
  const [subraces, setSubraces] = useState<Array<{ index: string; name: string }>>([])
  const [subclasses, setSubclasses] = useState<DnDSubclassListItem[]>([])
  const [loadingSubraces, setLoadingSubraces] = useState(false)
  const [loadingSubclasses, setLoadingSubclasses] = useState(false)
  const [isPending, startTransition] = useTransition()

  async function handleRaceSelect(raceIndex: string) {
    setSelectedRace(raceIndex)
    setSelectedSubrace('')
    setSubraces([])
    setLoadingSubraces(true)
    try {
      const res = await fetch(`https://www.dnd5eapi.co/api/2014/races/${raceIndex}`)
      const data = await res.json()
      setSubraces(data.subraces ?? [])
    } finally {
      setLoadingSubraces(false)
    }
  }

  async function handleClassSelect(classIndex: string) {
    setSelectedClass(classIndex)
    setSelectedSubclass('')
    setSubclasses([])
    setLoadingSubclasses(true)
    try {
      const res = await fetch(`https://www.dnd5eapi.co/api/2014/classes/${classIndex}/subclasses`)
      const data = await res.json()
      setSubclasses(data.results ?? [])
    } finally {
      setLoadingSubclasses(false)
    }
  }

  const needsSubclass = subclasses.length > 0
  const canProceed = selectedRace && selectedClass && (!needsSubclass || selectedSubclass)

  function handleNext() {
    if (!canProceed) return
    startTransition(() =>
      saveStep1(characterId, {
        race: selectedRace,
        subrace: selectedSubrace || null,
        class: selectedClass,
        subclass: selectedSubclass || null,
        level,
      })
    )
  }

  return (
    <div className="space-y-10">
      {/* Race selection */}
      <section>
        <SectionTitle
          step="Step 1 of 6"
          title="Choose your Race"
          subtitle="Your race defines your heritage, physical traits, and some natural abilities."
        />
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {races.map(race => {
            const desc = RACE_DESCRIPTIONS[race.index] ?? 'A proud and ancient people.'
            const isSelected = selectedRace === race.index
            return (
              <button
                key={race.index}
                type="button"
                onClick={() => handleRaceSelect(race.index)}
                className={`p-4 rounded-xl border-2 text-left transition-all ${
                  isSelected
                    ? 'border-amber-500 bg-amber-500/10'
                    : 'border-stone-700 bg-stone-900 hover:border-stone-500'
                }`}
              >
                <p className="font-semibold text-stone-100 capitalize mb-1">{race.name}</p>
                <p className="text-stone-400 text-xs leading-snug line-clamp-2">{desc}</p>
              </button>
            )
          })}
        </div>

        {/* Subraces */}
        {loadingSubraces && (
          <p className="text-stone-500 text-sm mt-4">Loading subraces…</p>
        )}
        {subraces.length > 0 && (
          <div className="mt-4">
            <p className="text-stone-300 text-sm font-medium mb-3">
              Choose a subrace for <span className="text-amber-400 capitalize">{selectedRace}</span>:
            </p>
            <div className="flex flex-wrap gap-2">
              {subraces.map(sr => (
                <button
                  key={sr.index}
                  type="button"
                  onClick={() => setSelectedSubrace(sr.index)}
                  className={`px-4 py-2 rounded-lg border text-sm transition-all ${
                    selectedSubrace === sr.index
                      ? 'border-amber-500 bg-amber-500/10 text-amber-400'
                      : 'border-stone-600 text-stone-300 hover:border-stone-400'
                  }`}
                >
                  {sr.name}
                </button>
              ))}
            </div>
          </div>
        )}
      </section>

      {/* Class selection */}
      <section>
        <SectionTitle
          step=""
          title="Choose your Class"
          subtitle="Your class is your adventuring specialisation — it defines your abilities and playstyle."
        />
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {classes.map(cls => {
            const info = CLASS_DESCRIPTIONS[cls.index]
            const isSelected = selectedClass === cls.index
            return (
              <button
                key={cls.index}
                type="button"
                onClick={() => handleClassSelect(cls.index)}
                className={`p-4 rounded-xl border-2 text-left transition-all ${
                  isSelected
                    ? 'border-amber-500 bg-amber-500/10'
                    : 'border-stone-700 bg-stone-900 hover:border-stone-500'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <p className="font-semibold text-stone-100 capitalize">{cls.name}</p>
                  {info && (
                    <span className="text-xs text-amber-600 font-mono">{info.hitDie}</span>
                  )}
                </div>
                <p className="text-stone-400 text-xs leading-snug line-clamp-2">
                  {info?.flavor ?? 'A versatile class for any adventure.'}
                </p>
              </button>
            )
          })}
        </div>

        {/* Subclasses */}
        {loadingSubclasses && (
          <p className="text-stone-500 text-sm mt-4">Loading subclasses…</p>
        )}
        {subclasses.length > 0 && (
          <div className="mt-4">
            <p className="text-stone-300 text-sm font-medium mb-3">
              Choose a subclass for <span className="text-amber-400 capitalize">{selectedClass}</span>{' '}
              <span className="text-stone-500 text-xs">(you can change this later)</span>:
            </p>
            <div className="flex flex-wrap gap-2">
              {subclasses.map(sc => (
                <button
                  key={sc.index}
                  type="button"
                  onClick={() => setSelectedSubclass(sc.index)}
                  className={`px-4 py-2 rounded-lg border text-sm transition-all ${
                    selectedSubclass === sc.index
                      ? 'border-amber-500 bg-amber-500/10 text-amber-400'
                      : 'border-stone-600 text-stone-300 hover:border-stone-400'
                  }`}
                >
                  {sc.name}
                </button>
              ))}
            </div>
          </div>
        )}
      </section>

      {/* Starting level */}
      <section>
        <SectionTitle
          step=""
          title="Starting Level"
          subtitle="Most campaigns begin at level 1. Your DM may set a higher starting level."
        />
        <div className="flex items-center gap-6">
          <button
            type="button"
            onClick={() => setLevel(l => Math.max(1, l - 1))}
            disabled={level <= 1}
            className="w-12 h-12 rounded-xl border-2 border-stone-600 hover:border-stone-400 disabled:opacity-30 disabled:cursor-not-allowed text-stone-300 text-2xl font-light flex items-center justify-center transition-colors"
          >
            −
          </button>
          <div className="text-center min-w-[4rem]">
            <p className="text-5xl font-bold text-stone-100 leading-none">{level}</p>
            <p className="text-stone-500 text-xs mt-1">Level</p>
          </div>
          <button
            type="button"
            onClick={() => setLevel(l => Math.min(20, l + 1))}
            disabled={level >= 20}
            className="w-12 h-12 rounded-xl border-2 border-stone-600 hover:border-stone-400 disabled:opacity-30 disabled:cursor-not-allowed text-stone-300 text-2xl font-light flex items-center justify-center transition-colors"
          >
            +
          </button>
          <div className="ml-4 bg-stone-900 border border-stone-700 rounded-xl px-4 py-3">
            <p className="text-stone-400 text-xs">Proficiency Bonus</p>
            <p className="text-amber-400 text-xl font-bold">+{profBonus(level)}</p>
          </div>
        </div>
      </section>

      {/* Nav */}
      <div className="flex justify-end pt-4 border-t border-stone-800">
        <button
          type="button"
          onClick={handleNext}
          disabled={!canProceed || isPending}
          className="px-8 py-3 bg-amber-500 hover:bg-amber-400 disabled:opacity-40 disabled:cursor-not-allowed text-stone-950 font-semibold rounded-lg transition-colors"
        >
          {isPending ? 'Saving…' : 'Next: Your Story →'}
        </button>
      </div>
    </div>
  )
}
