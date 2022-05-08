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

/**
 * @param root {string}
 * @return {Promise<toa.formation.context.Context>}
 */
const context = async (root) => {
  const path = resolve(root, CONTEXT)
  /** @type {toa.formation.context.Context} */
  const context = await yaml(path)
  const roots = resolve(root, context.packages)

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
