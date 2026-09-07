import { readFileSync } from 'node:fs'
import { join } from 'node:path'

/**
 * The version of Toa. This package is versioned with every release, so its version
 * is the runtime's, whether or not the runtime is installed beside it.
 */
export const version: string = JSON.parse(
  readFileSync(join(import.meta.dirname, '../package.json'), 'utf8')
).version
