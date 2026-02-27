'use strict'

const { SystemException } = require("../exceptions")

class EntitySet {
  #set

  constructor (set) {
    this.#set = set
  }

  get () {
    return this.#set.map((entity) => entity.get())
  }

  set (values) {
    if (values.length !== this.#set.length)
      throw new SystemException('Objects array must not be modified')

    values.forEach((value, index) => this.#set[index].set(value))
  }

  events (input = undefined) {
    return this.#set.map((entity) => entity.event(input))
  }
}

exports.EntitySet = EntitySet
