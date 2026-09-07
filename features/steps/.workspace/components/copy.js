import { join } from 'node:path'
import { access, cp, mkdir } from 'node:fs/promises'

import { COLLECTION } from './constants.js'

/**
 * @param {string[]} list
 * @param {string} to
 * @returns {Promise<void>}
 */
export const copy = async (list, to) => {
  for (const component of list) {
    const source = join(COLLECTION, component)
    const target = join(to, 'components', component)

    await access(source).catch(() => {
      throw new Error(`Source directory '${source}' does not exist`)
    })

    await mkdir(target, { recursive: true })
    await cp(source, target, { recursive: true })
  }
}
