'use strict'

function addVariables (composition, variables) {
  const used = new Set()

  composition.variables ??= []

  for (const [key, set] of Object.entries(variables)) {
    if (key !== 'global' && !composition.components?.includes(key))
      continue

    for (const variable of set) {
      if (used.has(variable.name)) continue

      composition.variables.push(variable)
      used.add(variable.name)
    }
  }
}

exports.addVariables = addVariables
