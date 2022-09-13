'use strict'

const { match } = require('@toa.io/libraries/generic')
const { context } = require('./sample')
const { ReplayException } = require('./exceptions')

/**
 * @implements {toa.core.extensions.Annex}
 */
class Annex {
  name

  /** @type {toa.core.extensions.Annex} */
  #annex

  /**
   * @param {toa.core.extensions.Annex} annex
   */
  constructor (annex) {
    this.name = annex.name

    this.#annex = annex
  }

  invoke (...args) {
    const sample = /** @type {toa.sampling.Sample} */ context.get()
    const calls = sample?.extensions?.[this.name]

    if (calls === undefined) return this.#annex.invoke(...args)
    else return this.#replay(calls, args)
  }

  /**
   * @param {toa.sampling.sample.Call[]} calls
   * @param {any[]} args
   */
  #replay (calls, args) {
    const permanent = calls[0].permanent === true
    const sample = permanent ? calls[0] : calls.shift()

    if (sample.arguments !== undefined) {
      const matches = match(args, sample.arguments)

      if (!matches) throw new ReplayException(`Context extension '${this.name}' call arguments mismatch`)
    }

    if (sample.result !== undefined) return sample.result
    else return this.#annex.invoke(...args)
  }
}

exports.Annex = Annex
