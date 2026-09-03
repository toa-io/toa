import { join } from 'node:path'
import * as stage from '@toa.io/userland/stage'

import { COLLECTION } from './constants.js'

/**
 * @param {string} reference
 * @returns {toa.norm.Component}
 */
export const load = async (reference) => {
  const path = join(COLLECTION, reference)

  return stage.manifest(path)
}
