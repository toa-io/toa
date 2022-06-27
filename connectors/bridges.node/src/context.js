'use strict'

const { Connector } = require('@toa.io/core')
const { underlay } = require('@toa.io/libraries/generic')

class Context extends Connector {
  extensions
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
    this.extensions = this.#extensions(/** @type {toa.core.extensions.Context[]} */ this.#context.extensions)
  }

  local = underlay(async ([endpoint], [request]) => {
    return this.#context.apply(endpoint, request)
  })

  remote = underlay(async ([namespace, name, endpoint], [request]) => {
    return this.#context.call(namespace, name, endpoint, request)
  })

  /**
   * @param {toa.core.extensions.Context[]} extensions
   * @returns {{ [key: string]: Function}}
   */
  #extensions (extensions) {
    const map = {}

    for (const extension of extensions) {
      if (map[extension.name] !== undefined) throw new Error(`Context extensions conflict on '${extension.name}'`)

      map[extension.name] = extension.invoke.bind(extension)

      // well-known extensions
      if (extension.name === 'configuration') this.configuration = extension.invoke()
      if (extension.name === 'origins') this.origins = this.#origins(extension)
    }

    return map
  }

  /**
   * @param {toa.core.extensions.Context} extension
   */
  #origins (extension) {
    return underlay(async (segs, args) => {
      if (segs.length < 2) throw new Error(`Origins call requires at least 2 arguments, ${segs.length} given`)

      const name = segs.shift()
      const method = segs.pop().toUpperCase()
      const path = segs.join('/')
      const request = { method, ...args[0] }
      const options = args[1]

      return await extension.invoke(name, path, request, options)
    })
  }
}

exports.Context = Context
