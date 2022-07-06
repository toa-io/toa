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
   * @param composition {toa.norm.context.Composition}
   * @param image {toa.operations.deployment.images.Image}
   */
  constructor (composition, image) {
    this.name = composition.name
    this.image = image.reference
    this.components = composition.components.map(component)
  }
}

/**
 * @param {toa.norm.Component} component
 * @returns {string}
 */
const component = (component) => component.locator.label

exports.Composition = Composition
