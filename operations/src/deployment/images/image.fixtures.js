'use strict'

const { Image } = require('./image')
const { generate } = require('randomstring')
const { hash } = require('@toa.io/generic')

const version = generate()
const name = generate()

/**
 * @implements {toa.deployment.images.Image}
 */
class Class extends Image {
  get name () {
    return name
  }

  get version () {
    return version
  }
}

/** @type {toa.norm.context.Runtime} */
const runtime = {
  version: generate()
}

exports.scope = generate()
exports.name = name
exports.version = hash(runtime.version + ';' + version)
exports.Class = Class
exports.runtime = runtime
exports.process = process
