import { resolve } from 'node:path'
import { convolve, environment as variables } from '@toa.io/generic'
import glob from 'fast-glob'
import { readFile } from 'node:fs/promises'
import { yaml as jsyaml } from '@toa.io/generic'

import { component } from './component.js'

import {
  dependencies,
  normalize,
  complete,
  dereference,
  evict,
  expand,
  validate
} from './.context/index.js'

export const context = async (root, environment = variables.get('TOA_ENV')) => {
  const path = resolve(root, CONTEXT)
  const context = /** @type {toa.norm.Context} */ await read(path)

  context.environment = environment

  convolve(context, environment)
  expand(context)
  normalize(context)

  validate(context)

  const paths = await glob(resolve(root, COMPONENTS), GLOB)

  context.components = await Promise.all(paths.map(component))

  // before anything is derived from what is left, so that nothing an evicted component
  // alone declared is resolved, annotated or deployed
  evict(context)

  // what a context declares of every component that stores anything, its own and the ones its
  // extensions bring, is given to them where those are known: inside `dependencies`
  context.dependencies = await dependencies(context)

  dereference(context)
  complete(context)

  return context
}

const CONTEXT = 'context.toa.yaml'
const COMPONENTS = 'components/*'

const GLOB = { onlyDirectories: true, absolute: true }

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
