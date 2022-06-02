'use strict'

// noinspection JSClosureCompilerSyntax
/**
 * @implements {toa.operations.deployment.Composition}
 */
class Composition {
  name
  image
  /** @type {Array<string>} */
  components

  /**
   * @param composition {toa.formation.context.Composition}
   * @param image {toa.operations.deployment.images.Image}
   */
  constructor (composition, image) {
    this.name = composition.name
    this.image = image.reference
    this.components = composition.components.map((component) => component.locator.label)
  }
}

exports.Composition = Composition
