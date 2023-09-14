'use strict'

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

exports.addVariables = addVariables
