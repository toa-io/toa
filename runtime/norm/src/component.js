import { join } from 'node:path'

import { readFile } from 'node:fs/promises'
import { yaml as jsyaml } from '@toa.io/generic'
import { find } from '@toa.io/generic'
import { Locator } from '@toa.io/core'

import {
  expand,
  merge,
  migrations,
  validate,
  collapse,
  dereference,
  defaults,
  normalize,
  extensions
} from './.component/index.js'

export const component = async (path) => {
  const manifest = await load(path)

  await normalize(manifest, path)
  await validate(manifest)
  await extensions(manifest)

  manifest.locator = new Locator(manifest.name, manifest.namespace)

  return manifest
}

const load = async (path, base, proto = false) => {
  if (base !== undefined) path = find(path, base, MANIFEST)

  const file = join(path, MANIFEST)
  const manifest = (await read(file)) ?? {}

  manifest.path = path

  const anonymous = manifest.name === undefined

  defaults(manifest, proto)
  await expand(manifest)

  await merge(path, manifest)
  await migrations(path, manifest)

  // an inherited migration is recorded under the prototype's name, and a generated one is not
  // the same on the next machine
  if (proto && anonymous && manifest.entity?.migrations !== undefined)
    throw new Error(`Prototype at '${path}' declares migrations, so it has to be named`)

  if (manifest.prototype !== null) {
    const prototype = await load(manifest.prototype, path, true)

    collapse(manifest, prototype)
  }

  dereference(manifest)
  // dependencies(manifest)

  return manifest
}

const MANIFEST = 'manifest.toa.yaml'

/**
 * Reads a YAML file, resolving anchors into distinct objects so that
 * mutating one node cannot reach another.
 *
 * @param {string} path
 * @return {Promise<object>}
 */
async function read(path) {
  const object = jsyaml.load(await readFile(path, 'utf8'))

  return jsyaml.load(jsyaml.dump(object, { noRefs: true, lineWidth: -1 }))
}
