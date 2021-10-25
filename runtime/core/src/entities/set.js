'use strict'

class EntitySet {
  #set

  constructor (set) {
    this.#set = set
  }

  get () {
    return this.#set.map((entity) => entity.get())
  }
}

exports.EntitySet = EntitySet
