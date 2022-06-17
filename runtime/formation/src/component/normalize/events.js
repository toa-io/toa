'use strict'

const events = (component) => {
  if (component.events === undefined) return

  const binding = component.bindings.find((binding) => require(binding).properties.async === true)

  for (const event of Object.values(component.events)) {
    if (event.binding === undefined) event.binding = binding
  }
}

exports.events = events
