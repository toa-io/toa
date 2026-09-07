import { createRequire } from 'node:module'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { pathToFileURL } from 'node:url'
import * as definitions from '@toa.io/definitions'

// import.meta.resolve takes no paths, and a dependency is named rather than
// written as a path
const require = createRequire(import.meta.url)

/**
 * What a package declares, read without running it.
 *
 * A first-party package's definition is in `@toa.io/definitions`. Another package's is
 * its `definition.js`, or its entry where it ships none — so an extension that exports
 * its `manifest` and `deployment` beside its `Factory` is read as it always was.
 *
 * @param {string} reference a package name, or a directory
 * @returns {Promise<toa.norm.Definition>}
 */
export function definition(reference) {
  cache[reference] ??= load(reference)

  return cache[reference]
}

const cache = {}

async function load(reference) {
  const known = await definitions.definition(reference)

  if (known !== undefined) return { name: reference, module: known }

  const name = metadata(reference)?.name ?? reference
  const module = await import(pathToFileURL(resolve(reference)).href)

  return { name, module }
}

function resolve(reference) {
  try {
    return require.resolve(join(reference, 'definition.js'))
  } catch {
    return require.resolve(reference)
  }
}

function metadata(reference) {
  try {
    return JSON.parse(
      readFileSync(require.resolve(join(reference, 'package.json')), 'utf8')
    )
  } catch {
    return null
  }
}
