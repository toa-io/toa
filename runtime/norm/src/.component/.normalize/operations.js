'use strict'

const operations = (component) => {
  if (component.operations === undefined) return

  for (const [endpoint, operation] of Object.entries(component.operations)) {
    if (operation.scope === 'none')
      operation.query = false

    if (operation.bindings === undefined) operation.bindings = component.bindings
    if (operation.bindings === null) operation.bindings = []
    if (operation.virtual === true) delete component.operations[endpoint]
  }
}

exports.operations = operations
