'use strict'

const { Connector } = require('@toa.io/core')
const { underlay } = require('@toa.io/libraries.generic')

class Context extends Connector {
  extensions
  origins

  #context

  /**
   * @param {toa.core.Context} context
   */
  constructor (context) {
    super()

    this.extensions = this.#extensions(/** @type {toa.core.extensions.Context[]} */ context.extensions)

    this.#context = context

    this.depends(context)
  }

  local = underlay(async ([endpoint], [request]) => {
    return this.#context.apply(endpoint, request)
  })

  remote = underlay(async ([domain, name, endpoint], [request]) => {
    return this.#context.call(domain, name, endpoint, request)
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

      // known extensions
      if (extension.name === 'origins') this.#origins(extension)
    }

    return map
  }

  /**
   * @param {toa.core.extensions.Context} extension
   */
  #origins (extension) {
    this.origins = underlay(async (segs, args) => {
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
