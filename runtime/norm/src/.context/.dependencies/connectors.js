'use strict'

const { resolve } = require('node:path')

const connectors = (context, extracted) => {
  const connectors = {}

  const components = (context.components === undefined
      ? extracted
      : context.components.concat(extracted)
  ) ?? []

  for (const component of components) {
    if (component.entity !== undefined) {
      let storage = component.entity.storage

      if (storage[0] === '.') {
        storage = resolve(component.path, storage)
      }

      connectors[storage] ??= []
      connectors[storage].push(component)
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
