'use strict'

const { Dependency } = require('./dependency')

class Factory {
  /** @type toa.package.Context */
  #context

  /**
   * @param context {toa.package.Context}
   */
  constructor (context) {
    this.#context = context
  }

  /**
   * @returns {Array<Dependency>}
   */
  dependencies () {
    const declarations = []

    /**
     * @param map {toa.package.DependencyMap}
     * @returns {Array<toa.operations.deployment.dependencies.charts.Chart>}
     */
    const map = (map) => {
      const list = []

      for (const [key, values] of Object.entries(map)) {
        const dependency = require(key)

        if (dependency.deployment !== undefined) {
          const deployment = dependency.deployment(values)

          list.push(deployment)
        }
      }

      return list
    }

    if (this.#context.connectors !== undefined) declarations.push(...map(this.#context.connectors))
    if (this.#context.extensions !== undefined) declarations.push(...map(this.#context.connectors))

    return declarations.map((declaration) => Factory.#dependency(declaration))
  }

  /**
   * @param declaration {toa.package.Dependency}
   * @returns {Dependency}
   */
  static #dependency (declaration) {
    // TODO: collapse charts?
    const charts = {}

    return new Dependency(charts)
  }
}

exports.Factory = Factory
