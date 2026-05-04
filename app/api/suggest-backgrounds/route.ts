import { NextResponse } from 'next/server'
import { suggestBackgrounds } from '@/lib/gemini'
import { PHB_BACKGROUNDS } from '@/lib/constants/backgrounds'

export async function POST(request: Request) {
  try {
    const { backstory, goal } = await request.json()

    if (!backstory?.trim() || !goal?.trim()) {
      return NextResponse.json({ error: 'Backstory and goal are required.' }, { status: 400 })
    }

    const backgroundList = PHB_BACKGROUNDS.map(b => `${b.name} (${b.index})`)
    const suggestions = await suggestBackgrounds(backstory, goal, backgroundList)

    // Validate suggestions against known backgrounds
    const validatedSuggestions = suggestions
      .filter(s => PHB_BACKGROUNDS.some(b => b.index === s.index))
      .slice(0, 3)

    return NextResponse.json({ suggestions: validatedSuggestions })
  } catch (err: unknown) {
    console.error('Gemini error:', err)
    const status = (err as { status?: number })?.status === 429 ? 429 : 500
    const message = status === 429
      ? 'AI suggestions are temporarily unavailable (rate limit). Please try again in a moment.'
      : 'Failed to generate suggestions. Please try again.'
    return NextResponse.json({ error: message }, { status })
  }
}
