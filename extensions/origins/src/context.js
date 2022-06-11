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
   * @param {string} name - Origin name
   * @param {string} path
   * @param {Object} [request] - node-fetch options
   * @param {string[]} [substitutions]
   * @returns {Promise}
   */
  invoke (name, path, request, substitutions) {
    const template = this.#origins[name]

    if (template === undefined) throw new Error(`Origin '${name}' is not defined`)

    const origin = template.replace(/\*\./g, (match) => {
      if (substitutions?.length > 0) return substitutions.shift() + '.'
      else return match
    })

    const url = new URL(origin)

    url.pathname = path

    return fetch(url.href, request)
  }
}

exports.Context = Context
