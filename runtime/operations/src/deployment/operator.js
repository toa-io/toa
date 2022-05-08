'use strict'

const { directory } = require('../util/directory')
const { merge } = require('@toa.io/gears')

/**
 * @implements {toa.operations.deployment.Operator}
 */
class Operator {
  /** @type {toa.operations.deployment.Deployment} */
  #deployment
  /** @type {toa.operations.deployment.images.Registry} */
  #registry

  /**
   * @param deployment {toa.operations.deployment.Deployment}
   * @param registry {toa.operations.deployment.images.Registry}
   */
  constructor (deployment, registry) {
    this.#deployment = deployment
    this.#registry = registry
  }

  async export (path) {
    const target = await Operator.#target('deployment', path)

    await this.#deployment.export(target)

    return target
  }

  async prepare (path) {
    const target = await Operator.#target('images', path)

    await this.#registry.prepare(target)

    return target
  }

  async build () {
    const target = await Operator.#target('images')

    await this.#registry.prepare(target)
    await this.#registry.push()

    // TODO: cleanup
  }

  async install (options = {}) {
    merge(options, OPTIONS, { ignore: true })

    // const [source] =
    await Promise.all([this.export(), this.build()])

    await this.#deployment.install()

    // TODO: cleanup
  }

  /**
   * @param type {string}
   * @param [path] {string}
   * @returns {Promise<string>}
   */
  static async #target (type, path) {
    if (path === undefined) path = await directory.temp(type)
    else path = await directory(path)

    return path
  }
}

/** @type {toa.operations.deployment.InstallationOptions} */
const OPTIONS = {
  dry: false,
  wait: true
}

exports.Operator = Operator
