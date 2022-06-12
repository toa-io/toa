'use strict'

const fetch = require('node-fetch')

const { Connector } = require('@toa.io/core')

/**
 * @implements {toa.core.context.Extension}
 */
class Context extends Connector {
  name = 'origins'

  /** @type {toa.extensions.origins.Origins} */
  #origins

  /**
   * @param {toa.extensions.origins.Declaration | Object} declaration
   */
  constructor (declaration) {
    super()

    this.#origins = declaration.origins
  }

  /**
   * @param {string} name - Origin's name
   * @param {string} path
   * @param {Object} [request] - node-fetch options
   * @param {string[]} [substitutions]
   * @returns {Promise}
   */
  invoke (name, path, request, substitutions) {
    let origin = this.#origins[name]

    if (origin === undefined) throw new Error(`Origin '${name}' is not defined`)

    if (substitutions !== undefined) origin = this.#substitute(origin, substitutions)

    const url = new URL(origin)

    if (path !== undefined) {
      const [pathname, search] = path.split('?')

      url.pathname = pathname
      if (search !== undefined) url.search = search
    }

    return fetch(url.href, request)
  }

  #substitute (origin, substitutions) {
    const replace = () => substitutions.shift()

    return origin.replace(/\*/g, replace)
  }
}

exports.Context = Context
