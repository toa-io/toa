import { join } from 'node:path'
import { createHash } from 'node:crypto'
import fs from 'node:fs/promises'
import glob from 'fast-glob'

import { definition } from '../../definition.js'

export async function version(manifest) {
  manifest.version ??= await hash(manifest)
}

/**
 * Identifies a build of a component: it becomes the tag of its image, so it must be the
 * same for the same sources and different for different ones — on any machine, and whichever
 * build produced them.
 *
 * What a build leaves out cannot change it: the bridge states what no build ships, a component
 * adds to that with `ignore` and puts one back with `!`, and `files` names what its version is
 * made of where a build copies only some of it. Its manifest is always one of them, because
 * what it declares is what a caller is held to.
 */
async function hash(manifest) {
  const files = (await list(manifest)).sort()
  const digests = await Promise.all(files.map((file) => digest(join(manifest.path, file))))
  const total = createHash('sha256')

  // the path is part of it: moving a file changes the build even if no content did
  for (let i = 0; i < files.length; i++) total.update(files[i]).update(digests[i])

  return total.digest('hex').slice(0, 8)
}

/**
 * @param {toa.norm.Component} manifest
 * @returns {Promise<string[]>} paths relative to the component
 */
async function list(manifest) {
  const files = await glob(patterns(manifest.files), {
    cwd: manifest.path,
    dot: true,
    onlyFiles: true,
    // sources a component keeps outside its own directory are its own: what a link points to is
    // hashed as the file it stands for, so changing it changes the version
    followSymbolicLinks: true,
    ignore: await ignore(manifest)
  })

  // what a component declares is what a caller is held to, so its manifest is always one of them
  if (!files.includes(MANIFEST) && (await exists(join(manifest.path, MANIFEST))))
    files.push(MANIFEST)

  return files
}

/** A path names what is under it, and a pattern is taken as it is. */
function patterns(files = ['**']) {
  return files.flatMap((file) => (file.includes('*') ? [file] : [file, file + '/**']))
}

async function ignore(manifest) {
  const { module } = await definition(manifest.bridge)
  const stated = manifest.ignore ?? []
  const back = new Set(
    stated.filter((pattern) => pattern[0] === '!').map((pattern) => pattern.slice(1))
  )

  return [
    ...(module.ignore ?? []).filter((pattern) => !back.has(pattern)),
    ...stated.filter((pattern) => pattern[0] !== '!')
  ]
}

async function exists(path) {
  return await fs
    .access(path)
    .then(() => true)
    .catch(() => false)
}

async function digest(path) {
  return createHash('sha256')
    .update(await fs.readFile(path))
    .digest()
}

const MANIFEST = 'manifest.toa.yaml'
