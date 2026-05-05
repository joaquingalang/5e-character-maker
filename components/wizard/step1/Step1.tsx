'use client'

import { useState, useTransition } from 'react'
import { saveStep1 } from '@/app/actions/character'
import { RACE_DESCRIPTIONS, CLASS_DESCRIPTIONS } from '@/lib/constants/class-skills'
import type { Character, DnDRaceListItem, DnDClassListItem, StaticRace, StaticClass, StaticSubrace, StaticSubclass } from '@/lib/types'

interface Props {
  characterId: string
  races: DnDRaceListItem[]
  classes: DnDClassListItem[]
  racesDetail: StaticRace[]
  classesDetail: StaticClass[]
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

export function Step1({ characterId, races, classes, racesDetail, classesDetail, initial }: Props) {
  const [selectedRace, setSelectedRace] = useState(initial.race ?? '')
  const [selectedSubrace, setSelectedSubrace] = useState(initial.subrace ?? '')
  const [selectedClass, setSelectedClass] = useState(initial.class ?? '')
  const [selectedSubclass, setSelectedSubclass] = useState(initial.subclass ?? '')
  const [level, setLevel] = useState(initial.level ?? 1)
  const [subraces, setSubraces] = useState<StaticSubrace[]>([])
  const [subclasses, setSubclasses] = useState<StaticSubclass[]>([])
  const [subraceDetail, setSubraceDetail] = useState<StaticSubrace | null>(null)
  const [subclassDetail, setSubclassDetail] = useState<StaticSubclass | null>(null)
  const [isPending, startTransition] = useTransition()

  function handleRaceSelect(raceIndex: string) {
    const raceData = racesDetail.find(r => r.index === raceIndex)
    setSelectedRace(raceIndex)
    setSelectedSubrace('')
    setSubraces(raceData?.subraces ?? [])
    setSubraceDetail(null)
  }

  function handleSubraceSelect(subraceIndex: string) {
    setSelectedSubrace(subraceIndex)
    setSubraceDetail(subraces.find(s => s.index === subraceIndex) ?? null)
  }

  function handleClassSelect(classIndex: string) {
    const classData = classesDetail.find(c => c.index === classIndex)
    setSelectedClass(classIndex)
    setSelectedSubclass('')
    setSubclasses(classData?.subclasses ?? [])
    setSubclassDetail(null)
  }

  function handleSubclassSelect(subclassIndex: string) {
    setSelectedSubclass(subclassIndex)
    setSubclassDetail(subclasses.find(s => s.index === subclassIndex) ?? null)
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
            const raceData = racesDetail.find(r => r.index === race.index)
            const desc = RACE_DESCRIPTIONS[race.index] ?? raceData?.description ?? 'A proud and ancient people.'
            const isSelected = selectedRace === race.index
            return (
              <div
                key={race.index}
                role="button"
                tabIndex={0}
                onClick={() => handleRaceSelect(race.index)}
                onKeyDown={e => (e.key === 'Enter' || e.key === ' ') && handleRaceSelect(race.index)}
                className={`p-4 rounded-xl border-2 text-left transition-all cursor-pointer ${
                  isSelected
                    ? 'border-amber-500 bg-amber-500/10'
                    : 'border-stone-700 bg-stone-900 hover:border-stone-500'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <p className="font-semibold text-stone-100 capitalize">{race.name}</p>
                  <a
                    href={`http://dnd5e.wikidot.com/lineage:${race.index}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={e => e.stopPropagation()}
                    className="text-stone-600 hover:text-amber-400 text-xs transition-colors shrink-0 ml-1"
                    title={`${race.name} on wikidot`}
                  >
                    ↗
                  </a>
                </div>
                <p className="text-stone-400 text-xs leading-snug line-clamp-2">{desc}</p>
              </div>
            )
          })}
        </div>

        {/* Subraces */}
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
                  onClick={() => handleSubraceSelect(sr.index)}
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
            {subraceDetail && (
              <div className="mt-3 p-4 rounded-xl bg-stone-800 border border-stone-700">
                {subraceDetail.description && (
                  <p className="text-stone-300 text-sm leading-relaxed">{subraceDetail.description}</p>
                )}
                {subraceDetail.ability_bonuses.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-2">
                    {subraceDetail.ability_bonuses.map(ab => (
                      <span
                        key={ab.ability_score.index}
                        className="text-xs bg-amber-500/10 text-amber-400 border border-amber-500/20 rounded px-2 py-0.5"
                      >
                        +{ab.bonus} {ab.ability_score.name}
                      </span>
                    ))}
                  </div>
                )}
                {subraceDetail.traits.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1">
                    {subraceDetail.traits.map(t => (
                      <span key={t} className="text-xs text-stone-400 border border-stone-600 rounded px-2 py-0.5">{t}</span>
                    ))}
                  </div>
                )}
              </div>
            )}
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
              <div
                key={cls.index}
                role="button"
                tabIndex={0}
                onClick={() => handleClassSelect(cls.index)}
                onKeyDown={e => (e.key === 'Enter' || e.key === ' ') && handleClassSelect(cls.index)}
                className={`p-4 rounded-xl border-2 text-left transition-all cursor-pointer ${
                  isSelected
                    ? 'border-amber-500 bg-amber-500/10'
                    : 'border-stone-700 bg-stone-900 hover:border-stone-500'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <p className="font-semibold text-stone-100 capitalize">{cls.name}</p>
                  <div className="flex items-center gap-1.5 shrink-0 ml-1">
                    {info && (
                      <span className="text-xs text-amber-600 font-mono">{info.hitDie}</span>
                    )}
                    <a
                      href={`http://dnd5e.wikidot.com/${cls.index}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={e => e.stopPropagation()}
                      className="text-stone-600 hover:text-amber-400 text-xs transition-colors"
                      title={`${cls.name} on wikidot`}
                    >
                      ↗
                    </a>
                  </div>
                </div>
                <p className="text-stone-400 text-xs leading-snug line-clamp-2">
                  {info?.flavor ?? 'A versatile class for any adventure.'}
                </p>
              </div>
            )
          })}
        </div>

        {/* Subclasses */}
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
                  onClick={() => handleSubclassSelect(sc.index)}
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
            {subclassDetail && (
              <div className="mt-3 p-4 rounded-xl bg-stone-800 border border-stone-700">
                {subclassDetail.flavor && (
                  <p className="text-stone-500 text-xs italic mb-2">{subclassDetail.flavor}</p>
                )}
                {subclassDetail.description && subclassDetail.description !== subclassDetail.flavor && (
                  <p className="text-stone-300 text-sm leading-relaxed">{subclassDetail.description}</p>
                )}
                <p className="text-stone-600 text-xs mt-1">{subclassDetail.source}</p>
              </div>
            )}
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
