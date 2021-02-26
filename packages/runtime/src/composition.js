'use strict'

class Composition {
  #runtimes = []

  add (runtime) {
    this.#runtimes.push(runtime)
  }

  async start () {
    await Promise.all(this.#runtimes.map((runtime) => runtime.connect()))
  }

  async stop () {
    await Promise.all(this.#runtimes.map((runtime) => runtime.disconnect()))
  }
}

exports.Composition = Composition
