'use strict'

const { Connector } = require('@toa.io/core')
const { underlay } = require('@toa.io/libraries/generic')

/**
 * @implements {toa.node.Context}
 */
class Context extends Connector {
  annexes
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
    this.annexes = this.#annexes(/** @type {toa.core.extensions.Annex[]} */ this.#context.annexes)
  }

  local = underlay(async ([endpoint], [request]) => {
    return this.#context.apply(endpoint, request)
  })

  remote = underlay(async ([namespace, name, endpoint], [request]) => {
    return this.#context.call(namespace, name, endpoint, request)
  })

  /**
   * @param {toa.core.extensions.Annex[]} annexes
   * @returns {{ [key: string]: Function}}
   */
  #annexes (annexes) {
    const map = {}

    for (const annex of annexes) {
      if (map[annex.name] !== undefined) throw new Error(`Annex conflict on '${annex.name}'`)

      map[annex.name] = annex.invoke.bind(annex)

      // well-known annexes
      if (annex.name === 'configuration') this.configuration = annex.invoke()
      if (annex.name === 'origins') this.origins = this.#origins(annex)
    }

    return map
  }

  /**
   * @param {toa.core.extensions.Annex} annex
   */
  #origins (annex) {
    return underlay(async (segs, args) => {
      if (segs.length < 2) throw new Error(`Origins call requires at least 2 arguments, ${segs.length} given`)

      const name = segs.shift()
      const method = segs.pop().toUpperCase()
      const path = segs.join('/')
      const request = { method, ...args[0] }
      const options = args[1]

      return await annex.invoke(name, path, request, options)
    })
  }
}

exports.Context = Context
