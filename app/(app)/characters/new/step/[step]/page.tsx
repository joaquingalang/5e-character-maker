import { notFound, redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getRaces, getClasses, getFullRaces, getFullClasses, getClassEquipment } from '@/lib/dnd-api'
import { PHB_BACKGROUNDS } from '@/lib/constants/backgrounds'
import type { Character } from '@/lib/types'

import { Step1 } from '@/components/wizard/step1/Step1'
import { Step2 } from '@/components/wizard/step2/Step2'
import { Step3 } from '@/components/wizard/step3/Step3'
import { Step4 } from '@/components/wizard/step4/Step4'
import { Step5 } from '@/components/wizard/step5/Step5'
import { Step6 } from '@/components/wizard/step6/Step6'

interface Props {
  params: Promise<{ step: string }>
  searchParams: Promise<{ id?: string }>
}

export default async function WizardStepPage({ params, searchParams }: Props) {
  const { step } = await params
  const { id } = await searchParams

  const stepNum = parseInt(step)
  if (isNaN(stepNum) || stepNum < 1 || stepNum > 6) notFound()
  if (!id) redirect('/dashboard')

  const supabase = await createClient()
  const { data: character } = await supabase
    .from('characters')
    .select('*')
    .eq('id', id)
    .single()

  if (!character) notFound()
  if (character.completed) redirect(`/characters/${id}`)

  const char = character as Character

  if (stepNum === 1) {
    const [races, classes] = await Promise.all([getRaces(), getClasses()])
    const racesDetail = getFullRaces()
    const classesDetail = getFullClasses()
    return <Step1 characterId={id} races={races} classes={classes}
                  racesDetail={racesDetail} classesDetail={classesDetail} initial={char} />
  }

  if (stepNum === 2) {
    if (!char.race || !char.class) redirect(`/characters/new/step/1?id=${id}`)
    return <Step2 characterId={id} initial={char} backgrounds={PHB_BACKGROUNDS} />
  }

  if (stepNum === 3) {
    if (!char.background) redirect(`/characters/new/step/2?id=${id}`)
    return <Step3 characterId={id} initial={char} />
  }

  if (stepNum === 4) {
    if (!char.skills) redirect(`/characters/new/step/3?id=${id}`)
    return <Step4 characterId={id} initial={char} />
  }

  if (stepNum === 5) {
    if (!char.ability_scores) redirect(`/characters/new/step/4?id=${id}`)
    const classEquipment = await getClassEquipment(char.class!)
    return <Step5 characterId={id} initial={char} classEquipment={classEquipment} />
  }

  if (stepNum === 6) {
    if (!char.equipment && char.current_step < 6) redirect(`/characters/new/step/5?id=${id}`)
    return <Step6 characterId={id} initial={char} />
  }

  notFound()
}
