'use strict'

const { resolve } = require('node:path')
const { convolve, directory: { glob } } = require('@toa.io/libraries/generic')
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
 * @param {string} root
 * @param {string} [environment]
 * @return {Promise<toa.formation.Context>}
 */
const context = async (root, environment) => {
  const path = resolve(root, CONTEXT)
  const context = /** @type {toa.formation.Context} */ await load(path)
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
