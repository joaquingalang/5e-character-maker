'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import type { AbilityScores, EquipmentItem } from '@/lib/types'

export async function createCharacter(): Promise<string> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data, error } = await supabase
    .from('characters')
    .insert({ user_id: user.id, current_step: 1, completed: false })
    .select('id')
    .single()

  if (error || !data) throw new Error(`Failed to create character: ${error?.message ?? error?.code ?? 'no data returned'}`)
  return data.id
}

export async function saveStep1(
  characterId: string,
  data: { race: string; subrace: string | null; class: string; subclass: string | null; level: number }
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { error } = await supabase
    .from('characters')
    .update({ ...data, current_step: 2 })
    .eq('id', characterId)

  if (error) throw new Error(`Failed to save step 1: ${error.message}`)
  redirect(`/characters/new/step/2?id=${characterId}`)
}

export async function saveStep2(
  characterId: string,
  data: { backstory: string; goal: string; background: string }
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { error } = await supabase
    .from('characters')
    .update({ ...data, current_step: 3 })
    .eq('id', characterId)

  if (error) throw new Error(`Failed to save step 2: ${error.message}`)
  redirect(`/characters/new/step/3?id=${characterId}`)
}

export async function saveStep3(characterId: string, skills: string[]) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { error } = await supabase
    .from('characters')
    .update({ skills, current_step: 4 })
    .eq('id', characterId)

  if (error) throw new Error(`Failed to save step 3: ${error.message}`)
  redirect(`/characters/new/step/4?id=${characterId}`)
}

export async function saveStep4(
  characterId: string,
  data: { ability_scores: AbilityScores; ability_score_method: string }
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { error } = await supabase
    .from('characters')
    .update({ ...data, current_step: 5 })
    .eq('id', characterId)

  if (error) throw new Error(`Failed to save step 4: ${error.message}`)
  redirect(`/characters/new/step/5?id=${characterId}`)
}

export async function saveStep5(characterId: string, equipment: EquipmentItem[]) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { error } = await supabase
    .from('characters')
    .update({ equipment, current_step: 6 })
    .eq('id', characterId)

  if (error) throw new Error(`Failed to save step 5: ${error.message}`)
  redirect(`/characters/new/step/6?id=${characterId}`)
}

export async function saveStep6(
  characterId: string,
  data: { name: string; alignment: string | null }
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { error } = await supabase
    .from('characters')
    .update({ ...data, current_step: 6, completed: true })
    .eq('id', characterId)

  if (error) throw new Error(`Failed to save step 6: ${error.message}`)
  redirect(`/characters/${characterId}`)
}

export async function deleteCharacter(characterId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { error } = await supabase
    .from('characters')
    .delete()
    .eq('id', characterId)

  if (error) throw new Error(`Failed to delete character: ${error.message}`)
  revalidatePath('/dashboard')
}
