'use strict'

/**
 * @implements {toa.stage.binding.Binding}
 */
class Binding {
  /** @type {Record<string, function[]>} */
  #subs = {}

  /** @type {Record<string, function>} */
  #calls = {}

  async subscribe (label, callback) {
    if (this.#subs[label] === undefined) this.#subs[label] = []

    this.#subs[label].push(callback)
  }

  async emit (label, message) {
    const callbacks = this.#subs[label]

    if (callbacks === undefined) return undefined

    const promises = callbacks.map((callback) => callback(message))

    await Promise.all(promises)
  }

  async reply (label, produce) {
    if (this.#calls[label] !== undefined) throw new Error(`Label '${label}' is already bound`)

    this.#calls[label] = produce
  }

  async request (label, request) {
    if (this.#calls[label] === undefined) throw new Error(`Label '${label}' is not bound`)

    return this.#calls[label](request)
  }

  reset () {
    this.#subs = {}
    this.#calls = {}
  }
}

const binding = new Binding()

exports.binding = binding
