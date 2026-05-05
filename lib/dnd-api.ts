import type { DnDRaceListItem, DnDClassListItem, StaticRace, StaticClass, ClassEquipment } from './types'
import racesData from './data/races.json'
import classesData from './data/classes.json'
import classEquipmentData from './data/class-equipment.json'

export function getFullRaces(): StaticRace[] {
  return racesData as StaticRace[]
}

export function getFullClasses(): StaticClass[] {
  return classesData as StaticClass[]
}

export async function getRaces(): Promise<DnDRaceListItem[]> {
  return (racesData as StaticRace[]).map(r => ({ index: r.index, name: r.name, url: '' }))
}

export async function getClasses(): Promise<DnDClassListItem[]> {
  return (classesData as StaticClass[]).map(c => ({ index: c.index, name: c.name, url: '' }))
}

export async function getClassEquipment(classIndex: string): Promise<ClassEquipment> {
  const data = classEquipmentData as Record<string, ClassEquipment>
  return data[classIndex] ?? { guaranteed: [], choices: [] }
}
