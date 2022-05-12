'use strict'

const { Image } = require('../../../src/deployment/images/image')
const { generate } = require('randomstring')

const key = generate()
const name = generate()

/**
 * @implements {toa.operations.deployment.images.Image}
 */
class Class extends Image {
  get name () {
    return name
  }

  get key () {
    return key
  }
}

const runtime = {}

exports.scope = generate()
exports.name = name
exports.key = key
exports.Class = Class
exports.runtime = runtime
exports.process = process
