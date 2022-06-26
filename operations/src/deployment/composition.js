'use strict'

// noinspection JSClosureCompilerSyntax
/**
 * @implements {toa.operations.deployment.Composition}
 */
class Composition {
  name
  image
  /** @type {string[]} */
  components

  /**
   * @param composition {toa.formation.context.Composition}
   * @param image {toa.operations.deployment.images.Image}
   */
  constructor (composition, image) {
    this.name = composition.name
    this.image = image.reference
    this.components = composition.components.map(component)
  }
}

/**
 * @param {toa.formation.Component} component
 * @returns {string}
 */
const component = (component) => component.locator.label

exports.Composition = Composition
