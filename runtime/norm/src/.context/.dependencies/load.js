import { createRequire } from 'node:module'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { pathToFileURL } from 'node:url'

// import.meta.resolve takes no paths, and a dependency is named rather than
// written as a path
const require = createRequire(import.meta.url)

/**
 * @param {string} path
 * @returns {Promise<{ metadata: object, module: object }>}
 */
async function load (path) {
  const metadata = loadMetadata(path)
  const module = await loadModule(path)

  return { metadata, module }
}

function loadMetadata (reference) {
  try {
    return JSON.parse(readFileSync(require.resolve(join(reference, 'package.json')), 'utf8'))
  } catch {
    return null
  }
}

/**
 * @param {string} reference
 * @returns {Promise<object>}
 */
async function loadModule (reference) {
  const path = require.resolve(reference)

  return await import(pathToFileURL(path).href)
}

export { load }
