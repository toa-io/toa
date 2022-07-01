'use strict'

const { join, dirname } = require('node:path')

const { Image } = require('./image')
const { directory: { copy } } = require('@toa.io/libraries/filesystem')

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
   * @param {string} scope
   * @param {toa.formation.context.Runtime} runtime
   * @param {string} reference
   * @param {toa.operations.deployment.dependency.Service} service
   */
  constructor (scope, runtime, reference, service) {
    super(scope, runtime)

    this.service = service.name

    this.#group = service.group
    this.#name = service.name
    this.#path = find(reference)
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

/**
 * @param {string} reference
 * @returns {string}
 */
const find = (reference) => {
  return dirname(require.resolve(join(reference, 'package.json')))
}

exports.Service = Service
