'use strict'

const { convolve } = require('@toa.io/gears')

const normalize = (component, environment) => {
  convolve(component, environment)

  if (component.operations !== undefined) operations(component)
  if (component.events !== undefined) events(component)
  if (component.extensions !== undefined) extensions(component)
}

const operations = (component) => {
  for (const [endpoint, operation] of Object.entries(component.operations)) {
    if (operation.bindings === undefined) operation.bindings = component.bindings
    if (operation.virtual === true) delete component.operations[endpoint]
  }
}

const events = (component) => {
  const binding = component.bindings.find((binding) => require(binding).properties.async === true)

  for (const event of Object.values(component.events)) {
    if (event.binding === undefined) event.binding = binding
  }
}

const extensions = (component) => {
  for (const [key, value] of Object.entries(component.extensions)) {
    const extension = require(key)

    if (extension.manifest?.normalize) component.extensions[key] = extension.manifest.normalize(value, component)
  }
}

exports.normalize = normalize
