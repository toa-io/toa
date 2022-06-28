'use strict'

const { join } = require('node:path')

/**
 * @param {toa.formation.context.dependencies.References} references
 * @param {Object} annotations
 * @returns {toa.formation.context.Dependencies}
 */
const resolve = (references, annotations) => {
  /** @type {toa.formation.context.Dependencies} */
  const dependencies = {}

  for (const [dependency, components] of Object.entries(references)) {
    const id = name(dependency)

    const instances = components.map((component) => ({
      locator: component.locator,
      manifest: component.extensions?.[id]
    }))

    dependencies[dependency] = instances

    const annotation = annotations[id]
    const module = require(dependency)

    if (annotation !== undefined && module.annotation !== undefined) {
      annotations[id] = module.annotation(annotation, instances)
    }
  }

  return dependencies
}

/**
 * @param {string} dependency
 * @returns {string}
 */
const name = (dependency) => {
  const pkg = require(join(dependency, 'package.json'))

  return pkg.name
}

exports.resolve = resolve
