'use strict'

const { Service } = require('./service')

class Composition extends Service {
  name
  components

  constructor (image, composition) {
    super(image)

    this.name = composition.name
    this.components = composition.components
    this.replicas = composition.replicas
  }
}

exports.Composition = Composition
