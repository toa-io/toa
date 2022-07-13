'use strict'

/**
 * @param {toa.norm.Context} context
 * @param {toa.deployment.Dependency} dependency
 * @returns {toa.deployment.Declaration}
 */
const declare = (context, dependency) => {
  const { references } = dependency
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
