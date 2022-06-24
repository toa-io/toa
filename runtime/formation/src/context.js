'use strict'

const { resolve } = require('node:path')
const { convolve } = require('@toa.io/libraries/generic')
const { load } = require('@toa.io/libraries/yaml')

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
  const context = /** @type {toa.formation.Context} */ await load(path)
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
