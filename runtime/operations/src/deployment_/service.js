'use strict'

class Service {
  image
  replicas = 2

  constructor (image) {
    this.image = image
  }
}

exports.Service = Service
