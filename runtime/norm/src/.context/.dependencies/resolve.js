'use strict'

const { join } = require('node:path')
const { load } = require('./load')

/**
 * @param {toa.norm.context.dependencies.References} references
 * @param {Object} annotations
 * @returns {toa.norm.context.Dependencies}
 */
const resolve = (references, annotations) => {
  /** @type {toa.norm.context.Dependencies} */
  const dependencies = {}

  for (const [dependency, components] of Object.entries(references)) {
    const { metadata, module } = load(dependency)
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

  return dependencies
}

exports.resolve = resolve
