'use strict'

/**
 * @implements {toa.stage.binding.Binding}
 */
class Binding {
  /** @type {Record<string, function[]>} */
  #callbacks = {}

  /** @type {Record<string, function>} */
  #producers = {}

  async subscribe (label, callback) {
    if (this.#callbacks[label] === undefined) this.#callbacks[label] = []

    this.#callbacks[label].push(callback)
  }

  async emit (label, message) {
    if (!(label in this.#callbacks)) return

    const callbacks = this.#callbacks[label]
    const promises = callbacks.map((callback) => callback(message))

    await Promise.all(promises)
  }

  async reply (label, produce) {
    if (label in this.#producers) throw new Error(`Label '${label}' is already bound`)

    this.#producers[label] = produce
  }

  async request (label, request) {
    if (!(label in this.#producers)) throw new Error(`Label '${label}' is not bound`)

    const produce = this.#producers[label]

    return produce(request)
  }

  reset () {
    this.#callbacks = {}
    this.#producers = {}
  }
}

const binding = new Binding()

exports.binding = binding
