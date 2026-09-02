import { join } from 'node:path'
import * as stage from '@toa.io/userland/stage'

import { COLLECTION } from './constants.js'

/**
 * @param {string} reference
 * @returns {Promise<toa.core.Component>}
 **/
const component = async (reference) => {
  const path = join(COLLECTION, reference)

  return stage.component(path)
}

export { component }
