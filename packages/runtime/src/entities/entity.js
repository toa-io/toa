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
    Object.seal(this)
  }
}

exports.Entity = Entity
