'use strict'

/**
 * @param {toa.norm.Context} context
 * @param {toa.operations.deployment.Dependency} dependency
 * @returns {toa.operations.deployment.Declaration}
 */
const declare = (context, { references }) => {
  const { name, description, version } = context

  const dependencies = references.map(({ values, ...rest }) => rest)

  return {
    ...DECLARATION,
    name,
    description,
    version,
    appVersion: version,
    dependencies
  }
}

const DECLARATION = {
  apiVersion: 'v2',
  type: 'application'
}

exports.declare = declare
