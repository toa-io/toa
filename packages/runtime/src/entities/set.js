'use strict'

class Set {
  #set

  constructor (set) {
    this.#set = set
  }

  get state () {
    return this.#set.map((entry) => entry.state)
  }
}

exports.Set = Set
