'use strict'

const { ProcessorException } = require('./exceptions')

/**
 * @implements {toa.conveyor.Conveyor}
 */
class Conveyor {
  /** @type {toa.conveyor.Processor} */
  #processor

  #promises = []
  #batch = []

  #busy = false

  /**
   * @param {toa.conveyor.Processor} processor
   */
  constructor (processor) {
    this.#processor = processor
  }

  async process (unit) {
    const promise = this.#promise(unit)

    if (!this.#busy) this.#process().then()

    return promise
  }

  async #process () {
    const units = [...this.#batch]
    const promises = [...this.#promises]

    this.#batch.length = 0
    this.#promises.length = 0
    this.#busy = true

    const results = await this.#processor(units)

    if (Array.isArray(results) && results.length !== promises.length) reject(promises)
    else resolve(promises, results)

    this.#busy = false

    if (this.#batch.length > 0) this.#process().then()
  }

  #promise (unit) {
    const completion = {}

    const promise = new Promise((resolve, reject) => {
      completion.resolve = resolve
      completion.reject = reject
    })

    this.#promises.push(completion)
    this.#batch.push(unit)

    return promise
  }
}

const resolve = (promises, results) => {
  const result = Array.isArray(results) ? undefined : results

  let i = 0

  for (const promise of promises) {
    const value = result ?? results[i]

    promise.resolve(value)
    i++
  }
}

const reject = (promises) => {
  const exception = new ProcessorException()

  for (const promise of promises) promise.reject(exception)
}

exports.Conveyor = Conveyor
