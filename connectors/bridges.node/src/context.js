'use strict'

const { Connector } = require('@toa.io/core')
const { underlay } = require('@toa.io/gears')

class Context extends Connector {
  extensions
  origins

  #context

  /**
   * @param {toa.core.Context} context
   */
  constructor (context) {
    super()

    this.extensions = this.#extensions(context.extensions)

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
   * @param {toa.core.context.Extension[]} extensions
   * @returns {{ [key: string]: Function}}
   */
  #extensions (extensions) {
    const map = {}

    for (const extension of extensions) {
      if (map[extension.name] !== undefined) throw new Error(`Context extensions conflict on '${extension.name}'`)

      map[extension.name] = (...args) => extension.invoke(...args)

      // known extensions
      if (extension.name === 'origins') this.#origins(extension)
    }

    return map
  }

  /**
   * @param {toa.core.context.Extension} extension
   */
  #origins (extension) {
    this.origins = underlay(async (segs, args) => {
      const name = segs.shift()
      const path = segs.join('/')
      const request = args[0]

      return await extension.invoke(name, path, request)
    })
  }
}

exports.Context = Context
