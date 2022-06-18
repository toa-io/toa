'use strict'

const { resolve } = require('node:path')
const { yaml, convolve } = require('@toa.io/gears')

const { find } = require('./component')

const {
  connectors,
  extensions,
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
  const context = /** @type {toa.formation.Context} */ await yaml(path)
  const roots = resolve(root, context.packages)

  context.environment = environment

  convolve(context, environment)
  expand(context)
  normalize(context)
  validate(context)

  context.components = await find(roots)
  context.connectors = connectors(context)
  context.extensions = extensions(context)

  dereference(context)
  complete(context)

  return context
}

const CONTEXT = 'context.toa.yaml'

exports.context = context
