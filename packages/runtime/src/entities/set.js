'use strict'

class Set {
  #set

  constructor (set) {
    this.#set = set
  }

  get () {
    return this.#set.map((entry) => entry.get())
  }
}

exports.Set = Set
