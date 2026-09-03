import { existsSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'

/**
 * Walks up from `cwd` looking for a file of that name, and answers its path, or `undefined`
 * at the root. The `find-up` package did this, and reaching version 8 it brought a dependency
 * declaring only an `import` condition, which no CommonJS consumer of this package can resolve.
 *
 * @param {string} name
 * @param {{ cwd?: string }} [options]
 * @returns {string | undefined}
 */
export function findUp (name, options = {}) {
  let directory = resolve(options.cwd ?? process.cwd())

  while (true) {
    const path = join(directory, name)

    if (existsSync(path)) return path

    const parent = dirname(directory)

    if (parent === directory) return undefined

    directory = parent
  }
}
