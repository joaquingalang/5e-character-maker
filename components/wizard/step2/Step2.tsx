'use client'

import { useState, useTransition } from 'react'
import { saveStep2 } from '@/app/actions/character'
import { PHB_BACKGROUNDS } from '@/lib/constants/backgrounds'
import type { Character, Background, AISuggestedBackground } from '@/lib/types'

interface Props {
  characterId: string
  initial: Partial<Character>
  backgrounds: Background[]
}

function BackgroundCard({
  background,
  isSelected,
  aiReason,
  onSelect,
}: {
  background: Background
  isSelected: boolean
  aiReason?: string
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
      {aiReason && (
        <p className="text-amber-400/80 text-xs italic mb-2">✨ {aiReason}</p>
      )}
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
  const [suggestions, setSuggestions] = useState<AISuggestedBackground[]>([])
  const [showAll, setShowAll] = useState(false)
  const [aiLoading, setAiLoading] = useState(false)
  const [aiError, setAiError] = useState('')
  const [isPending, startTransition] = useTransition()

  const canSuggest = backstory.trim().length >= 20 && goal.trim().length >= 10
  const canProceed = selectedBg && backstory.trim() && goal.trim()

  async function handleSuggest() {
    setAiError('')
    setAiLoading(true)
    setSuggestions([])
    try {
      const res = await fetch('/api/suggest-backgrounds', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ backstory, goal }),
      })
      const data = await res.json()
      if (data.error) throw new Error(data.error)
      setSuggestions(data.suggestions)
    } catch (err) {
      setAiError(err instanceof Error ? err.message : 'Something went wrong. Please try again.')
    } finally {
      setAiLoading(false)
    }
  }

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

  const suggestedBackgrounds = suggestions
    .map(s => backgrounds.find(b => b.index === s.index))
    .filter(Boolean) as Background[]

  const displayedBackgrounds = showAll ? backgrounds : suggestedBackgrounds

  return (
    <div className="space-y-8">
      <div>
        <p className="text-amber-500 text-xs font-semibold uppercase tracking-widest mb-1">Step 2 of 6</p>
        <h2 className="text-2xl font-bold text-stone-100">Your Character's Story</h2>
        <p className="text-stone-400 text-sm mt-1">
          Tell us about your character. The more detail you give, the better the AI suggestions!
        </p>
      </div>

      {/* Backstory */}
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

        {/* AI Suggest button */}
        <button
          type="button"
          onClick={handleSuggest}
          disabled={!canSuggest || aiLoading}
          className="flex items-center gap-2 px-5 py-2.5 bg-stone-800 hover:bg-stone-700 disabled:opacity-40 disabled:cursor-not-allowed border border-stone-600 hover:border-amber-500/50 text-stone-200 rounded-lg text-sm transition-all"
        >
          {aiLoading ? (
            <>
              <span className="animate-spin">⟳</span> Thinking…
            </>
          ) : (
            <>✨ Suggest backgrounds with AI</>
          )}
        </button>
        {!canSuggest && !aiLoading && (
          <p className="text-stone-600 text-xs">Write at least 20 characters in your backstory and 10 in your goal to enable AI suggestions.</p>
        )}
        {aiError && (
          <p className="text-red-400 text-sm bg-red-900/20 border border-red-800 rounded-lg px-4 py-2">{aiError}</p>
        )}
      </div>

      {/* Background picker */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-stone-200 font-semibold">
            {suggestions.length > 0 ? 'AI Suggestions' : 'All Backgrounds'}
          </h3>
          <button
            type="button"
            onClick={() => setShowAll(v => !v)}
            className="text-amber-400 hover:text-amber-300 text-sm underline underline-offset-2"
          >
            {showAll ? 'Show suggestions only' : 'Browse all backgrounds'}
          </button>
        </div>

        {suggestions.length === 0 && !showAll && (
          <div className="text-center py-10 border border-dashed border-stone-700 rounded-xl text-stone-500 text-sm">
            Use the AI button above to get personalised suggestions, or browse all backgrounds.
          </div>
        )}

        <div className="grid grid-cols-1 gap-3">
          {displayedBackgrounds.map(bg => {
            const suggestion = suggestions.find(s => s.index === bg.index)
            return (
              <BackgroundCard
                key={bg.index}
                background={bg}
                isSelected={selectedBg === bg.index}
                aiReason={suggestion?.reason}
                onSelect={() => setSelectedBg(bg.index)}
              />
            )
          })}
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
