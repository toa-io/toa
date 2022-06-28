'use strict'

const { connectors, extensions, resolve } = require('./.dependencies')

/**
 * @param {toa.formation.Context} context
 * @returns {toa.formation.context.Dependencies}
 */
const dependencies = (context) => {
  /** @type {toa.formation.context.dependencies.References} */
  const references = { ...connectors(context), ...extensions(context) }

  return resolve(references, context.annotations)
}

exports.dependencies = dependencies
