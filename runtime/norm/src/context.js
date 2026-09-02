import { resolve } from 'node:path'
import { convolve } from '@toa.io/generic'
import glob from 'fast-glob'
import { readFile } from 'node:fs/promises'
import * as jsyaml from 'js-yaml'

import { component } from './component.js'

import { dependencies, normalize, complete, dereference, expand, validate } from './.context/index.js'

const context = async (root, environment = process.env.TOA_ENV) => {
  const path = resolve(root, CONTEXT)
  const context = /** @type {toa.norm.Context} */ await read(path)

  context.environment = environment

  convolve(context, environment)
  expand(context)
  normalize(context)

  validate(context)

  const paths = await glob(resolve(root, COMPONENTS), GLOB)

  context.components = await Promise.all(paths.map(component))
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
async function read (path) {
  const object = jsyaml.load(await readFile(path, 'utf8'))

  return jsyaml.load(jsyaml.dump(object, { noRefs: true, lineWidth: -1 }))
}

export { context }
