'use strict'

function addVariables (composition, variables, keys = composition.components) {
  composition.variables ??= []

  const used = new Set(composition.variables.map((variable) => variable.name))

  for (const [key, set] of Object.entries(variables)) {
    if (key !== 'global' && !keys?.includes(key))
      continue

    for (const variable of set) {
      if (used.has(variable.name)) continue

      composition.variables.push(variable)
      used.add(variable.name)
    }
  }
}

exports.addVariables = addVariables
