'use strict'

const { resolve } = require('node:path')
const { convolve } = require('@toa.io/libraries/generic')
const { directory: { glob } } = require('@toa.io/libraries/filesystem')
const { load } = require('@toa.io/libraries/yaml')

const { component } = require('./component')

const {
  dependencies,
  normalize,
  complete,
  dereference,
  expand,
  validate
} = require('./.context')

/**
 * @type {toa.norm.context.Constructor}
 */
const context = async (root, environment = undefined) => {
  const path = resolve(root, CONTEXT)
  const context = /** @type {toa.norm.Context} */ await load(path)
  const pattern = resolve(root, context.packages)

  context.environment = environment

  convolve(context, environment)
  expand(context)
  normalize(context)

  validate(context)

  const paths = await glob(pattern)

  context.components = await Promise.all(paths.map(component))
  context.dependencies = dependencies(context)

  dereference(context)
  complete(context)

  return context
}

const CONTEXT = 'context.toa.yaml'

exports.context = context
