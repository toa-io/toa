import { join } from 'node:path'
import * as stage from '@toa.io/userland/stage'

import { COLLECTION } from './constants.js'

export const component = async (reference) => {
  const path = join(COLLECTION, reference)

  return stage.component(path)
}
