'use strict'

const { directory } = require('@toa.io/filesystem')

/**
 * @implements {toa.deployment.Operator}
 */
class Operator {
  /** @type {toa.deployment.Deployment} */
  #deployment
  /** @type {toa.deployment.images.Registry} */
  #registry

  /**
   * @param deployment {toa.deployment.Deployment}
   * @param registry {toa.deployment.images.Registry}
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
  }

  async install (options = {}) {
    options = Object.assign({}, OPTIONS, options)

    await Promise.all([this.export(), this.build()])
    await this.#deployment.install(options)
  }

  async template (options = {}) {
    await this.export()

    return await this.#deployment.template(options)
  }

  variables () {
    return this.#deployment.variables()
  }

  /**
   * @param type {string}
   * @param [path] {string}
   * @returns {Promise<string>}
   */
  static async #target (type, path) {
    if (path === undefined) path = await directory.temp('toa-' + type)
    else path = await directory.ensure(path)

    return path
  }
}

/** @type {toa.deployment.installation.Options} */
const OPTIONS = {
  wait: false
}

exports.Operator = Operator
