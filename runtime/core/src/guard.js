'use strict'

class Guard {
  name
  #bridge

  constructor (name, bridge) {
    this.name = name
    this.#bridge = bridge
  }

  fit (state, origin) {
    return this.#bridge.fit(state, origin)
  }
}

exports.Guard = Guard
