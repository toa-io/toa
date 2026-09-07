import { createRequire } from 'node:module'
import { dirname, join, relative, resolve, sep } from 'node:path'
import { mkdirSync, readdirSync, writeFileSync } from 'node:fs'
import type { Entry } from './read.js'

/**
 * Writes the digest of the components each extension ships: their manifests as norm reads
 * them, with every path that reaches into a package replaced by that package's name — so the
 * digest reads the same wherever this package is installed.
 *
 * Runs after the workspace transpiled, from the workspace, where every extension resolves.
 */
const require = createRequire(import.meta.url)

// norm types its manifests, not its functions
const { component } = (await import('@toa.io/norm')) as unknown as {
  component: (path: string) => Promise<object>
}

const DIGESTED = [
  'extensions.cadence',
  'extensions.configuration',
  'extensions.exposition',
  'extensions.introspection',
  'extensions.realtime'
]

const OUT = resolve(import.meta.dirname, '../../digest')

mkdirSync(OUT, { recursive: true })

const packages = ['@toa.io/prototype', ...DIGESTED.map((suffix) => '@toa.io/' + suffix)]
const roots = new Map(packages.map((name) => [root(name), name]))

for (const suffix of DIGESTED) {
  const directory = join(root('@toa.io/' + suffix), 'components')
  const entries: Entry[] = []

  for (const dirent of readdirSync(directory, { withFileTypes: true })) {
    if (!dirent.isDirectory()) continue

    const manifest = await component(join(directory, dirent.name))

    entries.push({ label: dirent.name.replace('.', '-'), manifest: relativize(manifest) })
  }

  writeFileSync(join(OUT, suffix + '.json'), JSON.stringify(entries))
}

function root(name: string): string {
  return dirname(require.resolve(name + '/package.json'))
}

/** Absolute paths into a package become `<name>/<inside>`; the locator norm rebuilds. */
function relativize(value: unknown): any {
  if (typeof value === 'string') return specifier(value)
  if (Array.isArray(value)) return value.map(relativize)

  if (value !== null && typeof value === 'object') {
    const object: Record<string, unknown> = {}

    for (const [key, item] of Object.entries(value))
      if (key !== 'locator') object[key] = relativize(item)

    return object
  }

  return value
}

function specifier(value: string): string {
  for (const [directory, name] of roots)
    if (value === directory || value.startsWith(directory + sep))
      return [name, ...relative(directory, value).split(sep)].filter(Boolean).join('/')

  return value
}
