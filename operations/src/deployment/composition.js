'use strict'

class Composition {
  name
  image
  /** @type {string[]} */
  components

  constructor (composition, image) {
    this.name = composition.name
    this.image = image.reference
    this.components = composition.components.map(component)
    this.resources = composition.resources
  }
}

const component = (component) => component.locator.label

exports.Composition = Composition
