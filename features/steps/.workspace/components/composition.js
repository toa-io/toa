import { join } from 'node:path'
import * as stage from '@toa.io/userland/stage'

import { COLLECTION } from './constants.js'

const composition = async (references, options) => {
  const paths = /** @type {string[]} */ references.map((reference) => join(COLLECTION, reference))

  await stage.composition(paths, options)
}

export { composition }
