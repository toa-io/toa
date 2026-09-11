import * as workspace from './workspace.js'

export class Operator {
  /** @type {toa.deployment.Deployment} */
  #deployment

  /** @type {toa.deployment.Registry} */
  #registry

  /** @type {string | undefined} */
  #environment

  /**
   * @param {toa.deployment.Deployment} deployment
   * @param {toa.deployment.Registry} registry
   * @param {string} [environment]
   */
  constructor(deployment, registry, environment) {
    this.#deployment = deployment
    this.#registry = registry
    this.#environment = environment
  }

  async export(path) {
    const target = await workspace.create('deployment', path)

    await this.#deployment.export(target)

    return target
  }

  async prepare(path) {
    return await this.#registry.prepare(path)
  }

  async push() {
    await this.#registry.push()
  }

  async install(options = {}) {
    options = Object.assign({}, OPTIONS, options)

    await Promise.all([this.export(), this.push()])
    await this.#registry.alias(this.#environment)
    await this.#deployment.install(options)
  }

  async template(options = {}) {
    await this.export()

    return await this.#deployment.template(options)
  }

  variables(options) {
    return this.#deployment.variables(options)
  }

  tags() {
    return this.#registry.tags()
  }
}

/** @type {toa.deployment.installation.Options} */
const OPTIONS = { wait: false }
