'use strict'

class Entity {
  constructor (value) {
    const { _id, _created, _updated, _deleted, _version, ...rest } = value

    Object.defineProperty(this, '_id', {
      configurable: false,
      writable: false,
      enumerable: true,
      value: _id
    })

    Object.assign(this, rest)
    // TODO: value must contain all unset entity properties with undefined value
    // also true for new objects
    // looks like it's schema.deafults() responsibility
    // Object.seal(this)
  }
}

exports.Entity = Entity
