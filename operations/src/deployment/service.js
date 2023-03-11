'use strict'

// noinspection JSClosureCompilerSyntax
/**
 * @implements {toa.deployment.Service}
 */
class Service {
  name
  image
  port
  ingress

  /**
   * @param service {toa.deployment.dependency.Service}
   * @param image {toa.deployment.images.Image}
   */
  constructor (service, image) {
    this.name = service.group + '-' + service.name
    this.port = service.port
    this.image = image.reference
    this.ingress = service.ingress
  }
}

exports.Service = Service
