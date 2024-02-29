'use strict'

const { Image } = require('./image')
const { generate } = require('randomstring')

const version = '168b04ff'
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
  version: '0.0.0'
}

/** @type {toa.norm.context.Registry} */
const registry = {
  base: 'node:alpine'
}

exports.scope = generate()
exports.name = name
exports.version = 'ba2409fc'
exports.Class = Class
exports.runtime = runtime
exports.registry = registry
exports.process = process
