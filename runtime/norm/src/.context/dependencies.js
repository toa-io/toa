'use strict'

const { connectors, extensions, resolve } = require('./.dependencies')

/**
 * @param {toa.norm.Context} context
 * @returns {toa.norm.context.Dependencies}
 */
const dependencies = (context) => {
  /** @type {toa.norm.context.dependencies.References} */
  const references = { ...connectors(context), ...extensions(context) }

  return resolve(references, context.annotations)
}

exports.dependencies = dependencies
