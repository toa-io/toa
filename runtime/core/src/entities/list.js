'use strict'

class List {
  #set

  constructor (set) {
    this.#set = set
  }

  get () {
    return this.#set.map((entry) => entry.get())
  }
}

exports.List = List
