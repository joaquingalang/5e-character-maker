import { readFileSync, writeFileSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = join(__dirname, '..')
const DATA_DIR = join(ROOT, 'lib', 'data')
const BASE = 'https://www.dnd5eapi.co/api/2014'

function rawOptLabel(opt) {
  if (opt.option_type === 'counted_reference') {
    return opt.count > 1 ? `${opt.count}× ${opt.of.name}` : opt.of.name
  }
  if (opt.option_type === 'multiple') return opt.items.map(rawOptLabel).join(' + ')
  if (opt.option_type === 'choice') return opt.choice.desc
  return 'Unknown'
}

function rawOptItems(opt) {
  if (opt.option_type === 'counted_reference') {
    return [{ index: opt.of.index, name: opt.of.name, quantity: opt.count }]
  }
  if (opt.option_type === 'multiple') return opt.items.flatMap(rawOptItems)
  if (opt.option_type === 'choice') {
    const desc = opt.choice.desc
    return [{ index: `choice-${desc.toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 40)}`, name: desc, quantity: 1 }]
  }
  return []
}

function transformChoiceGroup(group) {
  // Some groups use equipment_category instead of an options array (e.g. "any holy symbol")
  if (group.from.option_set_type === 'equipment_category') {
    const cat = group.from.equipment_category
    return {
      desc: group.desc,
      options: [{
        label: `Any ${cat.name}`,
        items: [{ index: `choice-${cat.index}`, name: `Any ${cat.name}`, quantity: 1 }],
        weaponCategory: cat.index,
      }],
    }
  }
  return {
    desc: group.desc,
    options: group.from.options.map(opt => ({
      label: rawOptLabel(opt),
      items: rawOptItems(opt),
      weaponCategory: opt.option_type === 'choice'
        ? opt.choice.from.equipment_category?.index
        : undefined,
    })),
  }
}

async function fetchClassEquipment(classIndex) {
  const res = await fetch(`${BASE}/classes/${classIndex}`)
  if (res.status === 404) {
    console.log(`  ${classIndex}: not in SRD API, using empty equipment`)
    return { guaranteed: [], choices: [] }
  }
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${classIndex}`)
  const data = await res.json()
  return {
    guaranteed: data.starting_equipment.map(e => ({
      index: e.equipment.index,
      name: e.equipment.name,
      quantity: e.quantity,
    })),
    choices: data.starting_equipment_options.map(transformChoiceGroup),
  }
}

async function main() {
  const classes = JSON.parse(readFileSync(join(DATA_DIR, 'classes.json'), 'utf8'))
  const result = {}

  for (const cls of classes) {
    process.stdout.write(`Fetching ${cls.name}...`)
    try {
      result[cls.index] = await fetchClassEquipment(cls.index)
      const g = result[cls.index].guaranteed.length
      const c = result[cls.index].choices.length
      console.log(` OK (${g} guaranteed, ${c} choice groups)`)
    } catch (err) {
      console.log(` FAIL: ${err.message}`)
      result[cls.index] = { guaranteed: [], choices: [] }
    }
  }

  writeFileSync(join(DATA_DIR, 'class-equipment.json'), JSON.stringify(result, null, 2))
  console.log(`\nWrote ${Object.keys(result).length} classes -> lib/data/class-equipment.json`)
}

main().catch(err => { console.error(err); process.exit(1) })
