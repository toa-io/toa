import clone from 'clone-deep'
import { existsSync, readFileSync } from 'node:fs'
import { readFile } from 'node:fs/promises'
import { basename, dirname, join } from 'node:path'
import { merge } from '@toa.io/generic'
import { component as load, definition, revive, NORMALIZED } from '@toa.io/norm'
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
 * A manifest already normalised, where there is one, and the sources read where there is not.
 *
 * A component of an application's own comes with the manifest its build wrote beside it. A
 * component an extension ships comes with none — its package is published once, long before
 * any image is built — but `@toa.io/definitions` carries the digest of those manifests, which
 * a deploy has read for as long as it has been unable to install the extension. A service runs
 * them from the package, so it reads the same digest rather than reading their sources again.
 *
 * Only a workspace normalises, then, which is the one place a source can have changed since.
 *
 * @param {string} path
 */
async function read(path) {
  const file = join(path, NORMALIZED)

  if (existsSync(file)) return revive(JSON.parse(await readFile(file, 'utf8')), path)

  return (await digested(path)) ?? (await load(path))
}

/**
 * What the digest holds for a component of an extension's own, by the directory it is in.
 *
 * An extension ships its components in `components/` beside its manifest and nowhere else, so
 * that is the whole of what is looked for: anything else — an application's own component, a
 * fixture in a workspace — is read from its sources.
 *
 * @param {string} path
 * @returns {Promise<object | undefined>}
 */
async function digested(path) {
  const directory = dirname(path)

  if (basename(directory) !== COMPONENTS) return undefined

  const root = dirname(directory)
  const manifest = join(root, MANIFEST)

  if (!existsSync(manifest)) return undefined

  const { name } = JSON.parse(readFileSync(manifest, 'utf8'))

  // the digest is of what Toa ships, and a package it does not define has none
  if (name === undefined || !name.startsWith(SCOPE)) return undefined

  const { module } = await definition(name)
  const { labels, manifests } = module.components?.() ?? {}

  if (manifests === undefined) return undefined

  // a chart names a component's workload the way the digest labels it
  const index = labels.indexOf(basename(path).replace('.', '-'))

  return index === -1 ? undefined : revive(manifests[index], path)
}

const SCOPE = '@toa.io/'

const COMPONENTS = 'components'

const MANIFEST = 'package.json'

const DEFAULTS = {}
