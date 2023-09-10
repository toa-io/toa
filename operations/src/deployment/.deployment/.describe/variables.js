'use strict'

const variables = (context, variables) => {
  if (variables.global === undefined) variables.global = []

  if (context.environment !== undefined) {
    const variable = { name: 'TOA_ENV', value: context.environment }

    variables.global.unshift(variable)
  }

  return variables
}

function addVariables (deployment, variables) {
  const used = new Set()

  deployment.variables ??= []

  for (const [key, set] of Object.entries(variables)) {
    if (key !== 'global' && !deployment.components?.includes(key)) continue

    for (const variable of set) {
      if (used.has(variable.name)) continue

      deployment.variables.push(variable)
      used.add(variable.name)
    }
  }
}

exports.variables = variables
exports.addVariables = addVariables
