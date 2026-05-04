import type { DnDRace, DnDRaceListItem, DnDClassListItem, DnDSubclassListItem, EquipmentItem } from './types'

const BASE = 'https://www.dnd5eapi.co/api/2014'

async function dndFetch<T>(path: string): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    next: { revalidate: 86400 }, // cache for 24 hours
  })
  if (!res.ok) throw new Error(`DnD API error for ${path}: ${res.status}`)
  return res.json()
}

export async function getRaces(): Promise<DnDRaceListItem[]> {
  const data = await dndFetch<{ results: DnDRaceListItem[] }>('/races')
  return data.results
}

export async function getRaceDetail(index: string): Promise<DnDRace> {
  return dndFetch<DnDRace>(`/races/${index}`)
}

export async function getClasses(): Promise<DnDClassListItem[]> {
  const data = await dndFetch<{ results: DnDClassListItem[] }>('/classes')
  return data.results
}

export async function getSubclasses(classIndex: string): Promise<DnDSubclassListItem[]> {
  const data = await dndFetch<{ results: DnDSubclassListItem[] }>(`/classes/${classIndex}/subclasses`)
  return data.results
}

// Equipment types matching the DnD5e API response shape
interface DnDEquipmentRef { index: string; name: string; url: string }
interface DnDCountedRef { option_type: 'counted_reference'; count: number; of: DnDEquipmentRef }
interface DnDMultipleOpt { option_type: 'multiple'; items: DnDRawOpt[] }
interface DnDChoiceOpt { option_type: 'choice'; choice: { desc: string; choose: number; type: string; from: { option_set_type: string; options?: DnDRawOpt[] } } }
type DnDRawOpt = DnDCountedRef | DnDMultipleOpt | DnDChoiceOpt | { option_type: string }

interface DnDClassEquipmentResponse {
  starting_equipment: Array<{ equipment: DnDEquipmentRef; quantity: number }>
  starting_equipment_options: Array<{
    desc: string
    choose: number
    type: string
    from: { option_set_type: string; options: DnDRawOpt[] }
  }>
}

export interface EquipmentOption { label: string; items: EquipmentItem[] }
export interface EquipmentChoiceGroup { desc: string; options: EquipmentOption[] }
export interface ClassEquipment { guaranteed: EquipmentItem[]; choices: EquipmentChoiceGroup[] }

function rawOptLabel(opt: DnDRawOpt): string {
  if (opt.option_type === 'counted_reference') {
    const o = opt as DnDCountedRef
    return o.count > 1 ? `${o.count}× ${o.of.name}` : o.of.name
  }
  if (opt.option_type === 'multiple') return (opt as DnDMultipleOpt).items.map(rawOptLabel).join(' + ')
  if (opt.option_type === 'choice') return (opt as DnDChoiceOpt).choice.desc
  return 'Unknown'
}

function rawOptItems(opt: DnDRawOpt): EquipmentItem[] {
  if (opt.option_type === 'counted_reference') {
    const o = opt as DnDCountedRef
    return [{ index: o.of.index, name: o.of.name, quantity: o.count }]
  }
  if (opt.option_type === 'multiple') return (opt as DnDMultipleOpt).items.flatMap(rawOptItems)
  if (opt.option_type === 'choice') {
    const desc = (opt as DnDChoiceOpt).choice.desc
    return [{ index: `choice-${desc.toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 40)}`, name: desc, quantity: 1 }]
  }
  return []
}

export async function getClassEquipment(classIndex: string): Promise<ClassEquipment> {
  const data = await dndFetch<DnDClassEquipmentResponse>(`/classes/${classIndex}`)
  return {
    guaranteed: data.starting_equipment.map(e => ({
      index: e.equipment.index,
      name: e.equipment.name,
      quantity: e.quantity,
    })),
    choices: data.starting_equipment_options.map(group => ({
      desc: group.desc,
      options: group.from.options.map(opt => ({ label: rawOptLabel(opt), items: rawOptItems(opt) })),
    })),
  }
}
