'use strict'

/**
 * @param {toa.norm.Context} context
 * @param {toa.deployment.dependency.Variables} variables
 * @returns {toa.deployment.dependency.Variables}
 */
const variables = (context, variables) => {
  if (variables.system === undefined) variables.system = []

  if (context.environment !== undefined) {
    const variable = format('TOA_ENV', context.environment)

    variables.system.push(variable)
  }

  return variables
}

/**
 * @param {string} name
 * @param {string} value
 * @returns {toa.deployment.dependency.Variable}
 */
const format = (name, value) => ({ name, value })

exports.variables = variables
