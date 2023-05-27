'use strict'

/**
 * @param {toa.norm.Context} context
 * @param {toa.deployment.dependency.Variables} variables
 * @returns {toa.deployment.dependency.Variables}
 */
const variables = (context, variables) => {
  if (variables.global === undefined) variables.global = []

  if (context.environment !== undefined) {
    const variable = { name: 'TOA_ENV', value: context.environment }

    variables.global.unshift(variable)
  }

  return variables
}

exports.variables = variables
