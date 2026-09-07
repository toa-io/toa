import clone from 'clone-deep'
import { existsSync } from 'node:fs'
import { readFile } from 'node:fs/promises'
import { basename, join } from 'node:path'
import { merge } from '@toa.io/generic'
import { component as load, revive, NORMALIZED } from '@toa.io/norm'
import { Locator } from '@toa.io/core'

import { span } from './span.js'

export const manifest = async (path, options = {}) => {
  options = merge(clone(options), DEFAULTS)

  const manifest = await span(
    { name: `manifest ${basename(path)}`, attributes: { path } },
    async () => await read(path)
  )

  if (manifest.extensions === undefined) manifest.extensions = {}

  if (options.extensions !== undefined) {
    for (const extension of options.extensions) {
      if (!(extension in manifest.extensions)) manifest.extensions[extension] = null
    }
  }

  if ('storage' in options && 'entity' in manifest)
    manifest.entity.storage = options.storage

  manifest.locator = new Locator(manifest.name, manifest.namespace)

  return manifest
}

/**
 * What the build wrote, where it wrote one. An image carries the manifest a build normalised;
 * a workspace has no such file and is read as it always was.
 *
 * @param {string} path
 */
async function read(path) {
  const file = join(path, NORMALIZED)

  if (!existsSync(file)) return await load(path)

  return revive(JSON.parse(await readFile(file, 'utf8')), path)
}

const DEFAULTS = {}
