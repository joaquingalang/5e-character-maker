import type { AbilityScores } from '@/lib/types'

type AbilityKey = keyof AbilityScores

export const CLASS_ABILITY_PRIORITIES: Record<string, AbilityKey[]> = {
  barbarian: ['str', 'con', 'dex', 'wis', 'cha', 'int'],
  bard:      ['cha', 'dex', 'con', 'int', 'wis', 'str'],
  cleric:    ['wis', 'con', 'str', 'cha', 'dex', 'int'],
  druid:     ['wis', 'con', 'dex', 'int', 'cha', 'str'],
  fighter:   ['str', 'con', 'dex', 'wis', 'cha', 'int'],
  monk:      ['dex', 'wis', 'con', 'str', 'int', 'cha'],
  paladin:   ['str', 'cha', 'con', 'wis', 'dex', 'int'],
  ranger:    ['dex', 'wis', 'con', 'str', 'int', 'cha'],
  rogue:     ['dex', 'int', 'con', 'wis', 'cha', 'str'],
  sorcerer:  ['cha', 'con', 'dex', 'wis', 'int', 'str'],
  warlock:   ['cha', 'con', 'dex', 'wis', 'int', 'str'],
  wizard:    ['int', 'dex', 'con', 'wis', 'cha', 'str'],
}

export const DEFAULT_PRIORITY: AbilityKey[] = ['str', 'dex', 'con', 'int', 'wis', 'cha']
