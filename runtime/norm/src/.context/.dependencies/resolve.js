import { definition } from '../../definition.js'

export const resolve = async (references, annotations = {}) => {
  const dependencies = {}

  for (const [dependency, components] of Object.entries(references)) {
    const { name: id, module } = await definition(dependency)

    const instances = components.map((component) => ({
      locator: component.locator,
      manifest: component.extensions?.[id],
      component
    }))

    dependencies[dependency] = instances

    const annotation = annotations?.[id]

    if (annotation !== undefined && module.annotation !== undefined) {
      annotations[id] = module.annotation(annotation, instances)
    }

    // what a component's declaration costs to install, read from the definition rather than
    // from the package: a deploy installs it, and nothing that declares nothing carries it
    if (module.installs !== undefined)
      for (const instance of instances)
        Object.assign(
          (instance.component.packages ??= {}),
          module.installs(instance, annotations[id])
        )
  }

  for (const dependency of Object.keys(annotations)) {
    if (dependency in dependencies) continue

    // an annotation may be keyed by a dependency id rather than by a module reference
    const module = await optional(dependency)

    if (module?.standalone === true) dependencies[dependency] = []
  }

  return dependencies
}

/**
 * @param {string} reference
 * @returns {object | null}
 */
async function optional(reference) {
  try {
    return (await definition(reference)).module
  } catch {
    return null
  }
}
