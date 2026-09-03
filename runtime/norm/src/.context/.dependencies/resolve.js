import { load } from './load.js'

export const resolve = async (references, annotations) => {
  const dependencies = {}

  for (const [dependency, components] of Object.entries(references)) {
    const { metadata, module } = await load(dependency)
    const id = metadata.name

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
async function optional (reference) {
  try {
    return (await load(reference)).module
  } catch {
    return null
  }
}
