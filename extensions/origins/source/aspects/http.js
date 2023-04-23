'use strict'

const fetch = require('node-fetch')

const { Connector } = require('@toa.io/core')
const { retry } = require('@toa.io/generic')

/**
 * @implements {toa.origins.http.Aspect}
 */
class Aspect extends Connector {
  /** @readonly */
  name = 'http'

  /** @type {toa.origins.annotation.Component} */
  #origins

  /**
   * @param {toa.origins.annotation.Component} declaration
   */
  constructor (declaration) {
    super()

    this.#origins = declaration
  }

  async invoke (name, path, request, options) {
    let origin = this.#origins[name]

    if (origin === undefined) throw new Error(`Origin '${name}' is not defined`)

    if (options?.substitutions !== undefined) origin = substitute(origin, options.substitutions)

    const url = path === undefined ? new URL(origin) : new URL(path, origin)

    return this.#request(url.href, request, options?.retry)
  }

  /**
   * @param {string} url
   * @param {import('node-fetch').RequestInit} request
   * @param {toa.generic.retry.Options} [options]
   * @return {Promise<import('node-fetch').Response>}
   */
  async #request (url, request, options) {
    const call = () => fetch(url, request)

    if (options === undefined) return call()
    else return this.#retry(call, options)
  }

  /**
   * @param {Function} call
   * @param {toa.generic.retry.Options} options
   * @return {any}
   */
  #retry (call, options) {
    return retry(async (retry) => {
      const response = await call()

      if (Math.floor(response.status / 100) !== 2) return retry()

      return response
    }, options)
  }
}

/**
 * @param {string} origin
 * @param {string[]} substitutions
 * @returns {string}
 */
const substitute = (origin, substitutions) => {
  const replace = () => substitutions.shift()

  return origin.replace(PLACEHOLDER, replace)
}

const PLACEHOLDER = /\*/g

exports.Aspect = Aspect
