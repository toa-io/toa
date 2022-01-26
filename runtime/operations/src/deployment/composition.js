'use strict'

class Composition {
  name
  components
  replicas
  image

  constructor (composition, image) {
    this.name = composition.name
    this.components = composition.components
    this.replicas = composition.replicas
    this.image = image
  }
}

exports.Composition = Composition
