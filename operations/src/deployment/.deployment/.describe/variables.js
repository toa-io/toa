'use strict'

/**
 * @param {toa.norm.Context} context
 * @param {toa.deployment.dependency.Variables} variables
 * @returns {toa.deployment.dependency.Variables}
 */
const variables = (context, variables) => {
  if (variables.global === undefined) variables.global = []

  if (context.environment !== undefined) {
    const variable = format('TOA_ENV', context.environment)

    variables.global.push(variable)
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
