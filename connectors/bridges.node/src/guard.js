'use strict'

class Guard {
  #guard
  #context

  constructor (guard, context) {
    this.#guard = guard
    this.#context = context
  }

  fit (state) {
    return this.#guard.guard(state, this.#context)
  }
}

exports.Guard = Guard
