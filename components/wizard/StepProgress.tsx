'use client'

import { usePathname } from 'next/navigation'

const STEPS = [
  { number: 1, label: 'Race & Class' },
  { number: 2, label: 'Your Story' },
  { number: 3, label: 'Skills' },
  { number: 4, label: 'Ability Scores' },
  { number: 5, label: 'Equipment' },
  { number: 6, label: 'Final Details' },
]

export function StepProgress() {
  const pathname = usePathname()
  const match = pathname.match(/\/step\/(\d+)/)
  const current = match ? parseInt(match[1]) : 1

  return (
    <nav aria-label="Character creation steps">
      <ol className="flex items-center gap-0">
        {STEPS.map((step, i) => {
          const done = step.number < current
          const active = step.number === current

          return (
            <li key={step.number} className="flex items-center flex-1 last:flex-none">
              <div className="flex flex-col items-center gap-1.5">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold border-2 transition-all ${
                    done
                      ? 'bg-amber-500 border-amber-500 text-stone-950'
                      : active
                      ? 'bg-stone-900 border-amber-500 text-amber-400'
                      : 'bg-stone-900 border-stone-600 text-stone-500'
                  }`}
                >
                  {done ? '✓' : step.number}
                </div>
                <span
                  className={`text-xs text-center hidden sm:block leading-tight max-w-[72px] ${
                    active ? 'text-amber-400 font-medium' : done ? 'text-stone-400' : 'text-stone-600'
                  }`}
                >
                  {step.label}
                </span>
              </div>

              {i < STEPS.length - 1 && (
                <div
                  className={`flex-1 h-0.5 mx-2 mb-4 sm:mb-6 transition-colors ${
                    done ? 'bg-amber-500' : 'bg-stone-700'
                  }`}
                />
              )}
            </li>
          )
        })}
      </ol>
    </nav>
  )
}
