export const operations = (component) => {
  if (component.operations === undefined) return

  for (const [endpoint, operation] of Object.entries(component.operations)) {
    // what an operation of this type acquires, where it did not say
    if (operation.type === 'computation' || operation.type === 'unmanaged') {
      operation.scope = 'none'
      operation.query = false
    } else if (operation.type === 'effect')
      operation.scope ??= 'none'

    if (operation.scope === 'none')
      operation.query = false

    // an operation that states no output states an empty schema, which every reply fits
    operation.output ??= {}

    if (operation.bindings === undefined) operation.bindings = component.bindings
    if (operation.bindings === null) operation.bindings = []
    if (operation.virtual === true) delete component.operations[endpoint]
  }
}
