import { GoogleGenerativeAI } from '@google/generative-ai'
import type { AISuggestedBackground } from './types'

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!)

export async function suggestBackgrounds(
  backstory: string,
  goal: string,
  backgroundNames: string[]
): Promise<AISuggestedBackground[]> {
  const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' })

  const prompt = `You are a D&D 5e dungeon master helping a player choose a background for their character.

Character's backstory: "${backstory}"
Character's current goal: "${goal}"

Based on this backstory and goal, suggest exactly 3 backgrounds from the list below that best fit this character.
Return ONLY a valid JSON array with no markdown, no code blocks, just the raw JSON:
[
  {"name": "Background Name", "index": "background-index", "reason": "One sentence explaining why this fits."},
  {"name": "Background Name", "index": "background-index", "reason": "One sentence explaining why this fits."},
  {"name": "Background Name", "index": "background-index", "reason": "One sentence explaining why this fits."}
]

Available backgrounds (use the exact name and index shown):
${backgroundNames.map(b => `- ${b}`).join('\n')}

Return ONLY the JSON array.`

  const result = await model.generateContent(prompt)
  const text = result.response.text().trim()

  // Strip markdown code fences if the model added them anyway
  const cleaned = text.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '').trim()
  return JSON.parse(cleaned) as AISuggestedBackground[]
}
