'use strict'

const connectors = (context, extracted) => {
  const connectors = {}

  const components = (context.components === undefined
      ? extracted
      : context.components.concat(extracted)
  ) ?? []

  for (const component of components) {
    if (component.entity !== undefined) {
      if (connectors[component.entity.storage] === undefined) {
        connectors[component.entity.storage] = []
      }

      connectors[component.entity.storage].push(component)
    }

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

      connectors[binding].push(component)
    }
  }

  return connectors
}

exports.connectors = connectors
