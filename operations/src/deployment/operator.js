'use strict'

const workspace = require('./workspace')

/**
 * @implements {toa.deployment.Operator}
 */
class Operator {
  /** @type {toa.deployment.Deployment} */
  #deployment

  /** @type {toa.deployment.Registry} */
  #registry

  /**
   * @param deployment {toa.deployment.Deployment}
   * @param registry {toa.deployment.Registry}
   */
  constructor (deployment, registry) {
    this.#deployment = deployment
    this.#registry = registry
  }

  async export (path) {
    const target = await workspace.create('deployment', path)

    await this.#deployment.export(target)

    return target
  }

  async prepare (path) {
    return await this.#registry.prepare(path)
  }

  async push () {
    await this.#registry.push()
  }

  async install (options = {}) {
    options = Object.assign({}, OPTIONS, options)

    await Promise.all([this.export(), this.push()])
    await this.#deployment.install(options)
  }

  async template (options = {}) {
    await this.export()

    return await this.#deployment.template(options)
  }

  variables () {
    return this.#deployment.variables()
  }
}

/** @type {toa.deployment.installation.Options} */
const OPTIONS = { wait: false }

exports.Operator = Operator
