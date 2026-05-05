import { load } from 'cheerio'
import { writeFileSync, mkdirSync, existsSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = join(__dirname, '..')
const DATA_DIR = join(ROOT, 'lib', 'data')
const BASE_URL = 'https://dnd5e.wikidot.com'
const DELAY_MS = 900

const ABILITY_MAP = {
  strength:     { index: 'str', name: 'Strength' },
  dexterity:    { index: 'dex', name: 'Dexterity' },
  constitution: { index: 'con', name: 'Constitution' },
  intelligence: { index: 'int', name: 'Intelligence' },
  wisdom:       { index: 'wis', name: 'Wisdom' },
  charisma:     { index: 'cha', name: 'Charisma' },
}

const RACE_SLUGS = [
  'dragonborn', 'dwarf', 'elf', 'gnome', 'half-elf', 'half-orc', 'halfling', 'human', 'tiefling',
  'aarakocra', 'aasimar', 'changeling', 'deep-gnome', 'eladrin', 'fairy', 'firbolg', 'genasi',
  'goliath', 'harengon', 'kenku', 'owlin', 'satyr', 'sea-elf', 'shadar-kai', 'tabaxi', 'tortle', 'triton',
]

const CLASS_SLUGS = [
  'artificer', 'barbarian', 'bard', 'cleric', 'druid', 'fighter', 'monk',
  'paladin', 'ranger', 'rogue', 'sorcerer', 'warlock', 'wizard',
]

const HIT_DICE = {
  artificer: 8, barbarian: 12, bard: 8, cleric: 8, druid: 8,
  fighter: 10, monk: 8, paladin: 10, ranger: 10, rogue: 8,
  sorcerer: 6, warlock: 8, wizard: 6,
}

function sleep(ms) {
  return new Promise(r => setTimeout(r, ms))
}

function slugify(text) {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')
}

async function fetchPage(url) {
  for (let attempt = 0; attempt < 3; attempt++) {
    await sleep(attempt === 0 ? DELAY_MS : 2000)
    try {
      const res = await fetch(url, {
        headers: { 'User-Agent': '5e-character-maker-scraper/1.0 (personal use)' },
      })
      if (res.status === 429 || res.status === 503) {
        process.stdout.write(' [rate-limited +6s]')
        await sleep(6000)
        continue
      }
      if (res.status === 404) return null
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      return load(await res.text())
    } catch (err) {
      if (attempt === 2) throw err
    }
  }
  return null
}

function parseAbilityBonuses(text) {
  if (/each (ability score )?increase|all ability scores increase/i.test(text)) {
    return Object.values(ABILITY_MAP).map(a => ({ ability_score: a, bonus: 1 }))
  }
  const bonuses = []
  const re = /\b(strength|dexterity|constitution|intelligence|wisdom|charisma)\b[^.]*?increases?\s+by\s+(\d+)/gi
  for (const m of text.matchAll(re)) {
    const ability = ABILITY_MAP[m[1].toLowerCase()]
    if (ability) bonuses.push({ ability_score: ability, bonus: parseInt(m[2]) })
  }
  return bonuses
}

function parseSpeed(text) {
  const m = text.match(/(\d+)\s*feet/)
  return m ? parseInt(m[1]) : null
}

function getDescription($, $content) {
  let desc = ''
  $content.children('p, blockquote').each((_, el) => {
    if (desc) return false
    const text = $(el).text().trim().replace(/\s+/g, ' ')
    if (text.length > 60 && !text.startsWith('Source:') && !text.startsWith('See the')) {
      desc = text
    }
  })
  if (!desc) {
    $content.find('em').first().each((_, el) => {
      const text = $(el).text().trim()
      if (text.length > 60) desc = text
    })
  }
  return desc
}

async function scrapeRace(slug) {
  const $ = await fetchPage(`${BASE_URL}/${slug}`)
  if (!$) return null
  const $c = $('#page-content')
  if (!$c.length) return null

  const name = $('#page-title').text().trim() ||
    slug.split('-').map(w => w[0].toUpperCase() + w.slice(1)).join(' ')
  const description = getDescription($, $c)

  let baseSpeed = 30
  let baseAbilityBonuses = []
  const subraces = []

  // Subraces are h2 headings on wikidot; base race traits come before the first h2
  let beforeFirstH2 = true
  let currentSubrace = null

  $c.children().each((_, el) => {
    const tag = el.tagName?.toLowerCase()
    if (!tag) return

    if (tag === 'h2') {
      if (currentSubrace && currentSubrace.ability_bonuses.length > 0) subraces.push(currentSubrace)
      beforeFirstH2 = false
      currentSubrace = {
        index: slugify($(el).text().trim()),
        name: $(el).text().trim(),
        source: 'Player\'s Handbook',
        description: '',
        ability_bonuses: [],
        traits: [],
      }
    } else if (tag === 'ul') {
      const bullets = []
      $(el).find('> li').each((_, li) => {
        bullets.push($(li).text().trim().replace(/\s+/g, ' '))
      })

      if (beforeFirstH2) {
        for (const b of bullets) {
          if (/speed/i.test(b)) { const spd = parseSpeed(b); if (spd) baseSpeed = spd }
          if (/ability score increase/i.test(b)) baseAbilityBonuses = parseAbilityBonuses(b)
        }
      } else if (currentSubrace) {
        for (const b of bullets) {
          if (/ability score increase/i.test(b)) {
            currentSubrace.ability_bonuses.push(...parseAbilityBonuses(b))
          } else {
            const m = b.match(/^([A-Z][^.]{0,55}?)\./)
            const traitName = m?.[1]?.trim()
            if (traitName && !/^(You|Your|As |This |The |See |Prerequisite)/i.test(traitName)) {
              currentSubrace.traits.push(traitName)
            }
          }
        }
      }
    }
  })
  if (currentSubrace && currentSubrace.ability_bonuses.length > 0) subraces.push(currentSubrace)

  return { index: slug, name, description, speed: baseSpeed, ability_bonuses: baseAbilityBonuses, source: 'Player\'s Handbook', subraces }
}

async function scrapeSubclass(classSlug, subclassSlug) {
  const $ = await fetchPage(`${BASE_URL}/${classSlug}:${subclassSlug}`)
  if (!$) return null
  const $c = $('#page-content')
  if (!$c.length) return null

  const name = $('#page-title').text().trim()
  let flavor = ''
  $c.children().each((_, el) => {
    if (flavor) return false
    const $el = $(el)
    const italic = $el.find('em, i').first().text().trim()
    if (italic.length > 40) { flavor = italic; return false }
    if ($el.is('p, blockquote')) {
      const text = $el.text().trim().replace(/\s+/g, ' ')
      if (text.length > 60 && !text.startsWith('Source:')) { flavor = text }
    }
  })
  return { name, flavor }
}

async function scrapeClass(slug) {
  const $ = await fetchPage(`${BASE_URL}/${slug}`)
  if (!$) return null
  const $c = $('#page-content')
  if (!$c.length) return null

  const name = $('#page-title').text().trim() || slug[0].toUpperCase() + slug.slice(1)
  const description = getDescription($, $c)

  let subclassLabel = ''
  const subclassRows = []

  // h3s are nested inside div elements, so use find() not children()
  $c.find('h3').each((_, h3el) => {
    if (subclassRows.length > 0) return false
    const h3Text = $(h3el).text().trim()
    // Find the next table sibling within the same parent container
    const table = $(h3el).nextAll('table').first()
    if (!table.length) return

    const rows = []
    table.find('tr').each((i, row) => {
      if (i === 0) return
      const cells = $(row).find('td')
      const $a = cells.eq(0).find('a').first()
      const href = $a.attr('href') ?? ''
      const cellName = $a.text().trim()
      const source = cells.eq(1).text().trim()

      if (!href || !cellName) return
      const m = href.match(/\/([\w-]+):([\w-]+)/)
      if (!m) return
      if (/unearthed arcana/i.test(source)) return

      rows.push({ slug: m[2], name: cellName, source: source || 'Player\'s Handbook' })
    })

    if (rows.length > 0) {
      subclassLabel = h3Text
      subclassRows.push(...rows)
    }
  })

  return { name, description, hit_die: HIT_DICE[slug] ?? 8, subclassLabel, subclassRows }
}

async function main() {
  if (!existsSync(DATA_DIR)) mkdirSync(DATA_DIR, { recursive: true })

  console.log('=== Scraping races ===')
  const races = []
  for (const slug of RACE_SLUGS) {
    process.stdout.write(`  ${slug}...`)
    try {
      const race = await scrapeRace(slug)
      if (race) {
        races.push(race)
        console.log(` OK (${race.subraces.length} subraces)`)
      } else {
        console.log(' 404, skipped')
      }
    } catch (err) {
      console.log(` FAIL: ${err.message}`)
    }
  }
  writeFileSync(join(DATA_DIR, 'races.json'), JSON.stringify(races, null, 2))
  console.log(`\nWrote ${races.length} races -> lib/data/races.json`)

  console.log('\n=== Scraping classes ===')
  const classes = []
  for (const slug of CLASS_SLUGS) {
    process.stdout.write(`  ${slug}...`)
    try {
      const cls = await scrapeClass(slug)
      if (!cls) { console.log(' 404, skipped'); continue }
      console.log(` OK (${cls.subclassRows.length} subclasses)`)

      const subclasses = []
      for (const row of cls.subclassRows) {
        process.stdout.write(`    ${row.slug}...`)
        try {
          const sub = await scrapeSubclass(slug, row.slug)
          subclasses.push({
            index: row.slug,
            name: sub?.name || row.name,
            source: row.source,
            flavor: sub?.flavor || '',
            description: sub?.flavor || '',
          })
          console.log(' OK')
        } catch (err) {
          console.log(` FAIL: ${err.message}`)
          subclasses.push({ index: row.slug, name: row.name, source: row.source, flavor: '', description: '' })
        }
      }

      classes.push({
        index: slug,
        name: cls.name,
        description: cls.description,
        hit_die: cls.hit_die,
        subclass_label: cls.subclassLabel,
        subclasses,
      })
    } catch (err) {
      console.log(` FAIL: ${err.message}`)
    }
  }
  writeFileSync(join(DATA_DIR, 'classes.json'), JSON.stringify(classes, null, 2))
  console.log(`\nWrote ${classes.length} classes -> lib/data/classes.json`)
}

main().catch(err => { console.error(err); process.exit(1) })
