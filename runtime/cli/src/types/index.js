import { basename, dirname, join, relative, sep } from 'node:path'
import { existsSync, readFileSync } from 'node:fs'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { component as load, context as normalize } from '@toa.io/norm'

import { component } from './component.js'
import { module as contextModule } from './context.js'

/**
 * Writes the types of a Context and of every component in it.
 *
 * @param {string} root the Context root
 * @param {string} [environment]
 * @returns {Promise<string[]>} what was written
 */
export async function types (root, environment) {
  const context = await normalize(root, environment)
  const own = new Map(context.components.map((manifest) => [manifest.locator.id, manifest]))
  const contributed = extras(context, own)

  const module = context.name
  const directory = join(root, TYPES)
  const written = []

  const referenced = []

  // a component of the application: its types go beside it, and it is reached by its package
  for (const manifest of own.values()) {
    const specifier = SCOPE + '/' + basename(manifest.path)

    written.push(...await surface(join(manifest.path, TYPES), component(manifest, module)))
    await declare(manifest.path, specifier, join(TYPES, 'index.d.ts'))

    referenced.push({ manifest, from: specifier })
  }

  // one an extension contributes ships its own types, and is referenced where they are
  for (const manifest of contributed) {
    const shipped = published(manifest)

    if (shipped !== undefined) {
      referenced.push({ manifest, from: shipped })
      continue
    }

    // an extension that ships none: its Component is written here instead
    await mkdir(join(directory, REMOTE), { recursive: true })

    const file = manifest.locator.id + '.ts'

    await writeFile(join(directory, REMOTE, file), component(manifest), 'utf8')

    referenced.push({ manifest, from: `./${REMOTE}/${manifest.locator.id}.js` })
    written.push(join(directory, REMOTE, file))
  }

  written.push(...await surface(directory, contextModule(context, referenced)))

  await declare(directory, module, 'index.d.ts')

  return written
}

/**
 * The types of components that belong to no Context of their own — the ones Toa and its
 * extensions ship. They are called, never written against a `remote` that is knowable here,
 * so what is written is what the manifest states and nothing more.
 *
 * @param {string[]} paths
 * @returns {Promise<string[]>}
 */
export async function components (paths) {
  const written = []

  for (const path of paths) {
    const manifest = await load(path)

    written.push(...await surface(join(path, TYPES), component(manifest)))
  }

  return written
}

/**
 * A component's types: what Toa writes from the manifest, and the module the component itself
 * owns. The second is written once and never again — it is where what no manifest states
 * belongs, and where a component written in TypeScript imports its own types from.
 *
 * @param {string} directory the `types` directory to write into
 * @param {string} generated
 * @returns {Promise<string[]>}
 */
async function surface (directory, generated) {
  const toa = join(directory, 'toa.d.ts')
  const index = join(directory, 'index.d.ts')

  await mkdir(directory, { recursive: true })
  await writeFile(toa, generated, 'utf8')

  const written = [toa]

  if (!existsSync(index)) {
    await writeFile(index, OWN, 'utf8')
    written.push(index)
  }

  return written
}

/** What a component's own type module says before the component says anything. */
const OWN = `export * from './toa.js'

// What a manifest does not state belongs here, and every run keeps it.
`

/**
 * Where a component's own package publishes its types, as the specifier that reaches them.
 * `undefined` where the package ships none — an extension built before they were generated.
 *
 * @param {toa.norm.Component} manifest
 * @returns {string | undefined}
 */
function published (manifest) {
  if (!existsSync(join(manifest.path, TYPES, 'index.d.ts'))) return undefined

  let directory = manifest.path

  // the package the component belongs to, and where it sits inside it
  while (directory !== dirname(directory)) {
    const file = join(directory, 'package.json')

    if (existsSync(file)) {
      const { name } = JSON.parse(readFileSync(file, 'utf8'))

      if (name === undefined) return undefined

      const inside = relative(directory, manifest.path).split(sep).join('/')

      return `${name}/${inside}/${TYPES}/index.js`
    }

    directory = dirname(directory)
  }

  return undefined
}

/**
 * The components the Context resolves that it does not itself declare — what its extensions
 * contribute. They are reachable through the dependencies rather than `components`.
 */
function extras (context, own) {
  const found = new Map()

  for (const dependencies of Object.values(context.dependencies ?? {}))
    for (const dependency of dependencies) {
      const manifest = dependency.component

      if (manifest === undefined || own.has(manifest.locator.id)) continue

      found.set(manifest.locator.id, manifest)
    }

  return [...found.values()].sort((a, b) => a.locator.id.localeCompare(b.locator.id))
}

/** Toa owns how a generated module is named, so it states it. */
async function declare (directory, name, entry = 'types.ts') {
  const path = join(directory, 'package.json')

  let declared = {}

  try {
    declared = JSON.parse(await readFile(path, 'utf8'))
  } catch {}

  if (declared.name === name && declared.types === entry) return

  await writeFile(path, JSON.stringify({
    ...declared,
    name,
    type: declared.type ?? 'module',
    private: declared.private ?? true,
    types: entry
  }, null, 2) + '\n', 'utf8')
}

const TYPES = 'types'
const REMOTE = 'remote'
const SCOPE = '@components'
