'use strict'

const { match } = require('@toa.io/libraries/generic')
const { storage } = require('./storage')
const { ReplayException } = require('./exceptions')

/**
 * @implements {toa.core.Context}
 */
class Context {
  /** @type {toa.core.Context} */
  #context

  constructor (context) {
    this.#context = context
  }

  async apply (endpoint, request) {
    const sample = /** @type {toa.sampling.sample.Context} */ storage.get()
    const calls = sample?.local?.[endpoint]

    if (calls !== undefined && calls.length > 0) {
      const call = calls.shift()
      const matches = match(request, call.request)

      if (matches === false) throw new ReplayException(`Local '${endpoint}' call mismatch`)

      return call.reply
    }

    return this.#context.apply(endpoint, request)
  }
}

exports.Context = Context
