import { join } from 'node:path'
import * as stage from '@toa.io/userland/stage'

import { COLLECTION } from './constants.js'

/** The same components as `composition`, as a process runs them, with any services. */
export const workload = async (references, options, services) => {
  const paths = /** @type {string[]} */ references.map((reference) =>
    join(COLLECTION, reference)
  )

  return await stage.workload(paths, options, services)
}
