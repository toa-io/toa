export const BANNER = `// Written by \`toa types\`. Every run rewrites it.
// What a manifest does not state belongs in a file of your own.

`

export const capitalize = (word) => word[0].toUpperCase() + word.slice(1)

/** Collects what a module needs to import, so that a writer can ask for a name where it uses it. */
export function collector () {
  const required = {}

  const importing = (module, ...names) => {
    required[module] ??= new Set()
    names.forEach((name) => required[module].add(name))
  }

  return { importing, required }
}

/**
 * @param {Record<string, Set<string>>} required
 * @returns {string}
 */
export function imports (required) {
  const lines = []

  for (const module of Object.keys(required).sort()) {
    const names = [...required[module]].sort().join(', ')

    lines.push(`import type { ${names} } from '${module}'`)
  }

  return lines.length === 0 ? '' : lines.join('\n') + '\n'
}
