'use strict'

const { directory } = require('@toa.io/gears')

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

    await directory.remove(target)
  }

  async install (options = {}) {
    options = Object.assign({}, OPTIONS, options)

    // noinspection ES6MissingAwait
    const tasks = [this.export()]

    if (options.dry !== true) {
      // noinspection JSCheckFunctionSignatures
      tasks.push(this.build())
    }

    const [source] = await Promise.all(tasks)

    await this.#deployment.install(options)

    await directory.remove(source)
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

/** @type {toa.operations.deployment.OperatorInstallationOptions} */
const OPTIONS = {
  dry: false,
  wait: false
}

exports.Operator = Operator
