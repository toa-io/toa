'use strict'

// noinspection JSClosureCompilerSyntax
/**
 * @implements {toa.operations.deployment.Composition}
 */
class Composition {
  /** @type {string} */
  name
  /** @type {Array<string>} */
  components
  /** @type {string} */
  image

  /**
   * @param composition {toa.formation.context.Composition}
   * @param image {toa.operations.deployment.images.Image}
   */
  constructor (composition, image) {
    this.name = composition.name
    this.components = composition.components.map((component) => component.locator.label)
    this.image = image.url
  }
}

exports.Composition = Composition
