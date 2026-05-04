'use client'

import { useState, useTransition } from 'react'
import { saveStep3 } from '@/app/actions/character'
import { CLASS_SKILLS, ALL_SKILLS } from '@/lib/constants/class-skills'
import { PHB_BACKGROUNDS } from '@/lib/constants/backgrounds'
import type { Character } from '@/lib/types'

interface Props {
  characterId: string
  initial: Partial<Character>
}

export function Step3({ characterId, initial }: Props) {
  const classIndex = initial.class?.toLowerCase() ?? ''
  const backgroundIndex = initial.background ?? ''

  const classConfig = CLASS_SKILLS[classIndex] ?? { choose: 2, from: [] }
  const background = PHB_BACKGROUNDS.find(b => b.index === backgroundIndex)
  const grantedSkills = background?.skill_proficiencies ?? []

  const availableSkills =
    classConfig.from[0] === 'all'
      ? ALL_SKILLS.map(s => s.index)
      : classConfig.from

  const [selected, setSelected] = useState<string[]>(() => {
    const existing = initial.skills ?? []
    return existing.filter(s => availableSkills.includes(s) && !grantedSkills.includes(s))
  })
  const [isPending, startTransition] = useTransition()

  const remaining = classConfig.choose - selected.length
  const canProceed = selected.length === classConfig.choose

  function toggleSkill(skillIndex: string) {
    if (grantedSkills.includes(skillIndex)) return
    setSelected(prev => {
      if (prev.includes(skillIndex)) return prev.filter(s => s !== skillIndex)
      if (prev.length >= classConfig.choose) return prev
      return [...prev, skillIndex]
    })
  }

  function handleNext() {
    startTransition(() => saveStep3(characterId, [...selected, ...grantedSkills]))
  }

  const displaySkills = ALL_SKILLS.filter(
    s => availableSkills.includes(s.index) || grantedSkills.includes(s.index)
  )

  return (
    <div className="space-y-8">
      <div>
        <p className="text-amber-500 text-xs font-semibold uppercase tracking-widest mb-1">Step 3 of 6</p>
        <h2 className="text-2xl font-bold text-stone-100">Choose your Skills</h2>
        <p className="text-stone-400 text-sm mt-1">
          Your <span className="text-stone-200 capitalize">{initial.class}</span> lets you pick{' '}
          <strong className="text-amber-400">{classConfig.choose} skill{classConfig.choose !== 1 ? 's' : ''}</strong>.
          Your <span className="text-stone-200 capitalize">{background?.name}</span> background has already granted you some skills.
        </p>
      </div>

      {/* Counter */}
      <div className="flex items-center gap-4 bg-stone-900 border border-stone-700 rounded-xl p-4">
        <div className="flex gap-1.5">
          {Array.from({ length: classConfig.choose }).map((_, i) => (
            <div
              key={i}
              className={`w-3 h-3 rounded-full transition-colors ${
                i < selected.length ? 'bg-amber-500' : 'bg-stone-600'
              }`}
            />
          ))}
        </div>
        <p className="text-stone-300 text-sm">
          {remaining > 0
            ? `Choose ${remaining} more skill${remaining !== 1 ? 's' : ''}`
            : '✓ All skills selected!'}
        </p>
      </div>

      {/* Skill list */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {displaySkills.map(skill => {
          const isGranted = grantedSkills.includes(skill.index)
          const isSelected = selected.includes(skill.index) || isGranted
          const isDisabled = isGranted || (!isSelected && remaining === 0)

          return (
            <button
              key={skill.index}
              type="button"
              onClick={() => toggleSkill(skill.index)}
              disabled={isDisabled && !isSelected}
              className={`flex items-center justify-between p-4 rounded-xl border-2 text-left transition-all ${
                isGranted
                  ? 'border-stone-600 bg-stone-800 cursor-default'
                  : isSelected
                  ? 'border-amber-500 bg-amber-500/10'
                  : isDisabled
                  ? 'border-stone-800 bg-stone-900 opacity-40 cursor-not-allowed'
                  : 'border-stone-700 bg-stone-900 hover:border-stone-500 cursor-pointer'
              }`}
            >
              <div>
                <p className={`font-medium ${isSelected ? 'text-stone-100' : 'text-stone-300'}`}>
                  {skill.name}
                </p>
                <p className="text-xs text-stone-500">{skill.ability}</p>
              </div>
              <div className="shrink-0">
                {isGranted ? (
                  <span className="text-xs bg-stone-700 text-stone-400 px-2 py-1 rounded-full">
                    Background
                  </span>
                ) : isSelected ? (
                  <span className="text-amber-400 text-lg">✓</span>
                ) : null}
              </div>
            </button>
          )
        })}
      </div>

      {/* Nav */}
      <div className="flex justify-between pt-4 border-t border-stone-800">
        <a
          href={`/characters/new/step/2?id=${characterId}`}
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
          {isPending ? 'Saving…' : 'Next: Ability Scores →'}
        </button>
      </div>
    </div>
  )
}
