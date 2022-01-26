'use strict'

class Chart {
  name

  #context
  #compositions
  #dependencies

  constructor (context, compositions) {
    this.name = context.name

    this.#context = context
    this.#compositions = compositions
    this.#dependencies = Chart.dependencies(context)
  }

  get declaration () {
    const { name, description, version } = this.#context
    const dependencies = this.#dependencies.map((dependency) => dependency.chart)

    return {
      apiVersion: 'v2',
      type: 'application',
      name,
      description,
      version,
      appVersion: version,
      dependencies
    }
  }

  get values () {
    const result = {}

    result.compositions = this.#deployments()
    result.components = this.#context.components.map((component) => component.domain + '-' + component.name)

    for (const { chart, values } of this.#dependencies) result[chart.alias || chart.name] = values

    return result
  }

  #deployments () {
    return Array.from(this.#compositions).map((composition) => {
      const { name, components, replicas, image: { tag: image } } = composition

      return {
        name,
        components: components.map((component) => component.locator.label),
        replicas,
        image
      }
    })
  }

  static dependencies (context) {
    const map = (map) => {
      const list = []

      for (const [key, values] of Object.entries(map)) {
        const dependency = require(key)

        if (dependency.deployments !== undefined) list.push(...dependency.deployments(values))
      }

      return list
    }

    const dependencies = []

    if (context.connectors !== undefined) dependencies.push(...map(context.connectors))
    if (context.extensions !== undefined) dependencies.push(...map(context.extensions))

    return dependencies
  }
}

exports.Chart = Chart
