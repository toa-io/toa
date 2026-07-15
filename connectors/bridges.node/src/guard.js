'use strict'

class Guard {
  #guard
  #context

  constructor (guard, context) {
    this.#guard = guard
    this.#context = context
  }

  fit (state, origin) {
    return this.#guard.guard(state, origin, this.#context)
  }
}

exports.Guard = Guard
