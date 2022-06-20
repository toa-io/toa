'use strict'

const { join } = require('node:path')

const { Image } = require('./image')
const { directory: { copy } } = require('@toa.io/gears')

class Service extends Image {
  dockerfile = join(__dirname, 'service.Dockerfile')

  /**
   * Used by Dockerfile
   *
   * @readonly
   * @type {string}
   * */
  service

  /** @type {string} */
  #group
  /** @type {string} */
  #name
  /** @type {string} */
  #path
  /** @type {string} */
  #version

  /**
   * @param scope {string}
   * @param runtime {toa.formation.context.Runtime}
   * @param path {string}
   * @param service {toa.operations.deployment.dependency.Service}
   */
  constructor (scope, runtime, path, service) {
    super(scope, runtime)

    this.service = service.name

    this.#group = service.group
    this.#name = service.name
    this.#path = path
    this.#version = service.version
  }

  get name () {
    return this.#group + '-' + this.#name
  }

  get version () {
    return this.#version
  }

  async prepare (root) {
    const context = await super.prepare(root)

    await copy(this.#path, context)

    return context
  }
}

exports.Service = Service
