'use strict'

const { describe } = require('./describe')

const connectors = (context) => {
  const connectors = {}

  for (const component of context.components) {
    if (connectors[component.entity.storage] === undefined) {
      connectors[component.entity.storage] = []
    }

    connectors[component.entity.storage].push(
      describe(component)
    )

    const bindings = new Set()

    if (component.operations !== undefined) {
      for (const operation of Object.values(component.operations)) {
        operation.bindings.forEach((binding) => bindings.add(binding))
      }
    }

    if (component.events !== undefined) {
      for (const event of Object.values(component.events)) {
        bindings.add(event.binding)
      }
    }

    for (const binding of bindings) {
      if (connectors[binding] === undefined) {
        connectors[binding] = []
      }

      connectors[binding].push(describe(component))
    }
  }

  return connectors
}

exports.connectors = connectors
