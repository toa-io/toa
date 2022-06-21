'use strict'

const { Image } = require('../../../src/deployment/images/image')
const { generate } = require('randomstring')
const { hash } = require('@toa.io/libraries.generic')

const version = generate()
const name = generate()

/**
 * @implements {toa.operations.deployment.images.Image}
 */
class Class extends Image {
  get name () {
    return name
  }

  get version () {
    return version
  }
}

/** @type {toa.formation.context.Runtime} */
const runtime = {
  version: generate()
}

exports.scope = generate()
exports.name = name
exports.version = hash(runtime.version + ';' + version)
exports.Class = Class
exports.runtime = runtime
exports.process = process
