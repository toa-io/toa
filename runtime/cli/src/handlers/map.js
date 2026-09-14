import { join } from 'node:path'
import { writeFile } from 'node:fs/promises'
import { context as load, map as versions } from '@toa.io/norm'

import { context as find } from '../util/find.js'

/**
 * @param {Record<string, string>} argv
 * @returns {Promise<void>}
 */
export async function map(argv) {
  const path = find(argv.path)
  const context = await load(path, argv.environment)

  await writeFile(
    join(path, argv.as),
    JSON.stringify(versions(context), null, 2) + '\n',
    'utf8'
  )
}
