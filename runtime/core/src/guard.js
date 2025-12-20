'use strict'

class Guard {
  name
  #bridge

  constructor (name, bridge) {
    this.name = name
    this.#bridge = bridge
  }

  fit (state) {
    return this.#bridge.fit(state)
  }
}

exports.Guard = Guard
