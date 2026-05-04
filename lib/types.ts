export interface EquipmentItem {
  index: string
  name: string
  quantity: number
}

export interface Character {
  id: string
  user_id: string
  race: string | null
  subrace: string | null
  class: string | null
  subclass: string | null
  backstory: string | null
  goal: string | null
  background: string | null
  skills: string[] | null
  ability_scores: AbilityScores | null
  ability_score_method: 'standard_array' | 'point_buy' | 'rolled' | null
  equipment: EquipmentItem[] | null
  level: number | null
  name: string | null
  alignment: string | null
  current_step: number
  completed: boolean
  created_at: string
  updated_at: string
}

export interface AbilityScores {
  str: number
  dex: number
  con: number
  int: number
  wis: number
  cha: number
}

export interface DnDRaceListItem {
  index: string
  name: string
  url: string
}

export interface DnDRace {
  index: string
  name: string
  speed: number
  ability_bonuses: Array<{
    ability_score: { index: string; name: string }
    bonus: number
  }>
  traits: Array<{ name: string; url: string }>
  subraces: Array<{ index: string; name: string; url: string }>
}

export interface DnDClassListItem {
  index: string
  name: string
  url: string
}

export interface DnDSubclassListItem {
  index: string
  name: string
  url: string
}

export interface Background {
  index: string
  name: string
  description: string
  skill_proficiencies: string[]
  feature_name: string
  feature_desc: string
}

export interface AISuggestedBackground {
  name: string
  index: string
  reason: string
}
