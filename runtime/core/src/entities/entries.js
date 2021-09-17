'use strict'

class Entries {
  #set

  constructor (set) {
    this.#set = set
  }

  get () {
    return this.#set.map((entry) => entry.get())
  }
}

exports.Entries = Entries
