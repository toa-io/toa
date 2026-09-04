import { basename, join } from 'node:path'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { context as normalize } from '@toa.io/norm'

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
    const path = join(manifest.path, 'types.ts')
    const specifier = SCOPE + '/' + basename(manifest.path)

    await writeFile(path, component(manifest, module), 'utf8')
    await declare(manifest.path, specifier)

    referenced.push({ manifest, from: specifier })
    written.push(path)
  }

  // one an extension contributes: it lives in node_modules, so its Component is written here
  await mkdir(join(directory, REMOTE), { recursive: true })

  for (const manifest of contributed) {
    const file = manifest.locator.id + '.ts'

    await writeFile(join(directory, REMOTE, file), component(manifest), 'utf8')

    referenced.push({ manifest, from: `./${REMOTE}/${manifest.locator.id}.js` })
    written.push(join(directory, REMOTE, file))
  }

  const index = join(directory, 'index.ts')

  await writeFile(index, contextModule(context, referenced), 'utf8')
  await declare(directory, module, 'index.ts')

  written.push(index)

  return written
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
