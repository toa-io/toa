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

  await writeFile(join(path, argv.as), document(versions(context)), 'utf8')
}

/**
 * One component per line, which is what whoever is debugging finds with `grep` and reads. The
 * contract itself is written as it is: what indenting it buys is nothing a program reads, and a
 * deployment is held to what a ConfigMap takes.
 *
 * @param {Record<string, import('@toa.io/core').Contract>} contracts
 * @returns {string}
 */
function document(contracts) {
  const entries = Object.entries(contracts).map(
    ([id, contract]) => JSON.stringify(id) + ':' + JSON.stringify(contract)
  )

  return '{\n' + entries.join(',\n') + '\n}\n'
}
