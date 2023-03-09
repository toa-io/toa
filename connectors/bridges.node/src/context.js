'use strict'

const { Connector } = require('@toa.io/core')
const { underlay } = require('@toa.io/generic')

/**
 * @implements {toa.node.Context}
 */
class Context extends Connector {
  aspects
  configuration
  origins

  #context

  /**
   * @param {toa.core.Context} context
   */
  constructor (context) {
    super()

    this.#context = context

    this.depends(context)
  }

  async connection () {
    this.aspects = this.#aspects(/** @type {toa.core.extensions.Aspect[]} */ this.#context.aspects)
  }

  local = underlay(async ([endpoint], [request]) => {
    return this.#context.apply(endpoint, request)
  })

  remote = underlay(async ([namespace, name, endpoint], [request]) => {
    return this.#context.call(namespace, name, endpoint, request)
  })

  /**
   * @param {toa.core.extensions.Aspect[]} aspects
   * @returns {{ [key: string]: Function}}
   */
  #aspects (aspects) {
    const map = {}

    for (const aspect of aspects) {
      if (map[aspect.name] !== undefined) throw new Error(`Aspect conflict on '${aspect.name}'`)

      map[aspect.name] = aspect.invoke.bind(aspect)

      // well-known aspects
      if (aspect.name === 'configuration') this.#configuration(aspect)
      if (aspect.name === 'origins') this.origins = this.#origins(aspect)
    }

    return map
  }

  /**
   * @param {toa.core.extensions.Aspect} aspect
   */
  #origins (aspect) {
    return underlay(async (segs, args) => {
      if (segs.length < 2) throw new Error(`Origins call requires at least 2 arguments, ${segs.length} given`)

      const name = segs.shift()
      const method = segs.pop().toUpperCase()
      const path = segs.join('/')
      const request = { method, ...args[0] }
      const options = args[1]

      return await aspect.invoke(name, path, request, options)
    })
  }

  /**
   * @param {toa.core.extensions.Aspect} aspect
   */
  #configuration (aspect) {
    Object.defineProperty(this, 'configuration', {
      get: () => aspect.invoke()
    })
  }
}

exports.Context = Context
