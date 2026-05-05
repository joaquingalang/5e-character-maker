'use client'

import { useState, useTransition } from 'react'
import { saveStep2 } from '@/app/actions/character'
import type { Character, Background } from '@/lib/types'

interface Props {
  characterId: string
  initial: Partial<Character>
  backgrounds: Background[]
}

function BackgroundCard({
  background,
  isSelected,
  onSelect,
}: {
  background: Background
  isSelected: boolean
  onSelect: () => void
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={`w-full text-left p-5 rounded-xl border-2 transition-all ${
        isSelected
          ? 'border-amber-500 bg-amber-500/10'
          : 'border-stone-700 bg-stone-900 hover:border-stone-500'
      }`}
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <p className="font-semibold text-stone-100">{background.name}</p>
        {isSelected && <span className="text-amber-400 text-lg shrink-0">✓</span>}
      </div>
      <p className="text-stone-400 text-sm mb-3">{background.description}</p>
      <div className="flex flex-wrap gap-1">
        {background.skill_proficiencies.map(skill => (
          <span
            key={skill}
            className="text-xs bg-stone-700 text-stone-300 px-2 py-0.5 rounded-full capitalize"
          >
            {skill.replace(/-/g, ' ')}
          </span>
        ))}
      </div>
    </button>
  )
}

export function Step2({ characterId, initial, backgrounds }: Props) {
  const [backstory, setBackstory] = useState(initial.backstory ?? '')
  const [goal, setGoal] = useState(initial.goal ?? '')
  const [selectedBg, setSelectedBg] = useState(initial.background ?? '')
  const [isPending, startTransition] = useTransition()

  const canProceed = selectedBg && backstory.trim() && goal.trim()

  function handleNext() {
    if (!canProceed) return
    startTransition(() =>
      saveStep2(characterId, {
        backstory: backstory.trim(),
        goal: goal.trim(),
        background: selectedBg,
      })
    )
  }

  return (
    <div className="space-y-8">
      <div>
        <p className="text-amber-500 text-xs font-semibold uppercase tracking-widest mb-1">Step 2 of 6</p>
        <h2 className="text-2xl font-bold text-stone-100">Your Character's Story</h2>
        <p className="text-stone-400 text-sm mt-1">
          Tell us about your character, then pick the background that fits their story.
        </p>
      </div>

      {/* Backstory & Goal */}
      <div className="space-y-5">
        <div>
          <label className="block text-stone-300 font-medium mb-2" htmlFor="backstory">
            Backstory{' '}
            <span className="text-stone-500 font-normal text-sm">— Where did they come from? What shaped them?</span>
          </label>
          <textarea
            id="backstory"
            value={backstory}
            onChange={e => setBackstory(e.target.value)}
            placeholder="e.g. Raised in a small fishing village that was raided by bandits when I was young. I survived by hiding in the forest, where a wandering monk found me and taught me the ways of discipline…"
            rows={5}
            className="w-full bg-stone-900 border border-stone-600 rounded-xl px-4 py-3 text-stone-100 placeholder-stone-600 focus:outline-none focus:border-amber-500 transition-colors resize-none text-sm leading-relaxed"
          />
          <p className="text-stone-600 text-xs mt-1 text-right">{backstory.length} chars</p>
        </div>

        <div>
          <label className="block text-stone-300 font-medium mb-2" htmlFor="goal">
            Current Goal{' '}
            <span className="text-stone-500 font-normal text-sm">— What does your character want most right now?</span>
          </label>
          <textarea
            id="goal"
            value={goal}
            onChange={e => setGoal(e.target.value)}
            placeholder="e.g. Find the bandits who destroyed my village and make them pay. Along the way, I want to learn more about my mentor's order…"
            rows={3}
            className="w-full bg-stone-900 border border-stone-600 rounded-xl px-4 py-3 text-stone-100 placeholder-stone-600 focus:outline-none focus:border-amber-500 transition-colors resize-none text-sm leading-relaxed"
          />
        </div>
      </div>

      {/* Background picker */}
      <div>
        <h3 className="text-stone-200 font-semibold mb-4">Choose a Background</h3>
        <div className="grid grid-cols-2 gap-3">
          {backgrounds.map(bg => (
            <BackgroundCard
              key={bg.index}
              background={bg}
              isSelected={selectedBg === bg.index}
              onSelect={() => setSelectedBg(bg.index)}
            />
          ))}
        </div>
      </div>

      {/* Nav */}
      <div className="flex justify-between pt-4 border-t border-stone-800">
        <a
          href={`/characters/new/step/1?id=${characterId}`}
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
          {isPending ? 'Saving…' : 'Next: Skills →'}
        </button>
      </div>
    </div>
  )
}
