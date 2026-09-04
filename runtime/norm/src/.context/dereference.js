/**
 * Resolves component IDs within compositions with Component objects
 * @param {toa.norm.Context} context
 * @returns {void}
 */
export const dereference = (context) => {
  const components = map(context.components)

  if (context.compositions !== undefined) {
    for (const composition of context.compositions) {
      composition.components = composition.components.map((id) => {
        const component = components[id]

        if (component === undefined)
          throw new Error(`Composition '${composition.name}' lists an unknown component '${id}'.`)

        return component
      })
    }
  }
}

/**
 * @param {Array<toa.norm.Component>} components
 * @returns {toa.norm.component.Map}
 */
const map = (components) => {
  /** @type {toa.norm.component.Map} */
  const map = {}

  for (const component of components) map[component.locator.id] = component

  return map
}
