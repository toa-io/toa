import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { createRequire } from 'node:module'
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs'
import { dirname, join } from 'node:path'

/*
A component an extension ships runs where the extension's own dependencies are not beside it —
in the gateway's image, installed per component, and in a composition that hosts the gateway,
installed from the digest. So what such a component imports it has to declare itself, and this
is what says so before a deploy finds out.
*/

const require = createRequire(import.meta.url)

/** every extension that ships components, whether or not any of them declares anything */
const EXTENSIONS = [
  'extensions.cadence',
  'extensions.configuration',
  'extensions.exposition',
  'extensions.introspection',
  'extensions.realtime'
]

const IMPORT = /(?:from|import|require)\s*\(?\s*['"]([^'"]+)['"]/g

for (const suffix of EXTENSIONS)
  describe(suffix, () => {
    const root = dirname(require.resolve(`@toa.io/${suffix}/package.json`))
    const extension = manifest(join(root, 'package.json'))
    const components = join(root, 'components')

    if (!existsSync(components)) return

    for (const label of readdirSync(components)) {
      const component = join(components, label)

      if (!statSync(component).isDirectory()) continue

      it(`${label} declares what it imports`, () => {
        const own = manifest(join(component, 'package.json'))
        const declared = new Set([
          ...Object.keys(own.dependencies ?? {}),
          // the extension's own are beside it wherever its components run
          ...Object.keys(extension.dependencies ?? {})
        ])

        for (const [name, file] of imported(component))
          assert.ok(declared.has(name), `'${name}' is imported by ${file} and declared nowhere`)
      })
    }
  })

function manifest(path: string): { dependencies?: Record<string, string> } {
  return existsSync(path) ? JSON.parse(readFileSync(path, 'utf8')) : {}
}

/**
 * What a component's modules import from outside itself, by the package it comes from. Only
 * what a bridge loads is read — the transpiled directories, not the sources beside them — so a
 * type, which is erased before anything runs, is not something to install.
 */
function* imported(root: string): Generator<[string, string]> {
  for (const file of loaded(root)) {
    const text = readFileSync(file, 'utf8')

    for (const [, specifier] of text.matchAll(IMPORT)) {
      // a Toa package is not a component's to declare: component code imports one as a type
      // and nothing else, and every one the definitions define is installed with the runtime
      if (specifier.startsWith('.') || specifier.startsWith('node:')) continue
      if (specifier.startsWith('@toa.io/')) continue

      yield [name(specifier), file.slice(root.length + 1)]
    }
  }
}

function* loaded(root: string): Generator<string> {
  for (const directory of LOADED) {
    const path = join(root, directory)

    if (existsSync(path)) yield* modules(path)
  }
}

function* modules(directory: string): Generator<string> {
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    const path = join(directory, entry.name)

    if (entry.isDirectory()) yield* modules(path)
    else if (entry.name.endsWith('.js')) yield path
  }
}

/** What a bridge loads a component's modules from. */
const LOADED = ['operations', 'events', 'receivers', 'guards']

/** `@aws-sdk/lib-storage/x` is `@aws-sdk/lib-storage`; `paseto/v3/local` is `paseto`. */
function name(specifier: string): string {
  const segments = specifier.split('/')

  return specifier.startsWith('@') ? segments.slice(0, 2).join('/') : segments[0]
}
