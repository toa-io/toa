'use strict'

const { resolve } = require('node:path')
const { yaml } = require('@toa.io/gears')

const { find } = require('./component')
const { validate } = require('./context/validate')
const { connectors } = require('./context/connectors')
const { extensions } = require('./context/extensions')
const { normalize } = require('./context/normalize')
const { complete } = require('./context/complete')
const { dereference } = require('./context/dereference')
const { expand } = require('./context/expand')

/**
 * @param {string} root
 * @param {string} [environment]
 * @return {Promise<toa.formation.Context>}
 */
const context = async (root, environment) => {
  const path = resolve(root, CONTEXT)
  const context = /** @type {toa.formation.Context} */ await yaml(path)
  const roots = resolve(root, context.packages)

  expand(context)
  normalize(context, environment)
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
