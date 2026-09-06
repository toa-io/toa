import { basename, extname, resolve } from 'node:path'
import { readFile } from 'node:fs/promises'

import glob from 'fast-glob'
import { yaml } from '@toa.io/generic'

/**
 * The migrations a component declares, in the order they are applied. The file name without its
 * extension is the migration's id, and sorting those ids is what orders them — so a name is
 * written to sort: `0001-indexes`, then `0002-default-role`.
 *
 * What a file contains is the storage's business; this reads it and hands it over.
 */
export const migrations = async (root, manifest) => {
  const paths = await glob(resolve(root, DIRECTORY, '*' + EXTENSIONS), GLOB)

  if (paths.length === 0) return

  if (manifest.entity === undefined)
    throw new Error(`Component at '${root}' declares migrations but stores nothing`)

  const ids = new Map()

  // sorted, so the two files a conflict names are the same two on every machine
  for (const path of paths.sort()) {
    const id = basename(path, extname(path))
    const found = ids.get(id)

    if (found !== undefined)
      throw new Error(
        `Component at '${root}' has more than one ${DIRECTORY}/${id}: ` +
          `${basename(found)} and ${basename(path)}`
      )

    ids.set(id, path)
  }

  manifest.entity.migrations = await Promise.all(
    Array.from(ids, async ([id, path]) => ({ id, steps: await read(path) }))
  )
}

/**
 * A migration is a list of steps. A file that is not one is refused here rather than at the
 * storage, where the component it belongs to is no longer known.
 */
async function read(path) {
  const steps = yaml.load(await readFile(path, 'utf8'))

  if (!Array.isArray(steps)) throw new Error(`Migration '${path}' is not a list of steps`)

  return steps
}

const DIRECTORY = 'migrations'
const EXTENSIONS = '.{yaml,yml,json}'
const GLOB = { onlyFiles: true, absolute: true }
