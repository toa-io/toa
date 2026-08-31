'use strict'

const { EntityContractException, EntityGuardException } = require('../exceptions')
const { newid } = require('./newid')

class Entity {
  deleted = false
  #schema
  #guards
  #origin = null
  #state
  #mutable = true

  /**
   * @param {boolean} [mutable] whether the entity may be modified and committed
   */
  constructor (schema, argument, guards, mutable = true) {
    this.#schema = schema
    this.#guards = guards

    if (typeof argument === 'object') {
      /*
       * The origin is the pre-image a commit diffs the new state against. An operation
       * that cannot commit has nothing to diff, so it takes the record as it came from
       * the storage instead of paying for a deep copy of every record it read.
       */
      this.#mutable = mutable

      if (mutable) {
        this.#set(structuredClone(argument))
        this.#origin = argument
      } else
        this.#set(argument)
    } else {
      const id = argument === undefined ? newid() : argument
      this.#init(id)
    }
  }

  get () {
    return this.#state
  }

  set (value, optional = false) {
    if (!this.#mutable)
      throw new Error('Entity acquired by a read-only operation cannot be modified')

    if (!optional)
      this.#guard(value)

    const error = optional ? this.#schema.fitOptional(value) : this.#schema.fit(value)

    if (error !== null)
      throw new EntityContractException(error, value)

    this.#revive(value)
    this.#set(value)
  }

  event (input = undefined) {
    return {
      origin: this.#origin,
      state: this.#state,
      trailers: this.#state._trailers,
      input
    }
  }

  #init (id) {
    const value = { id, _version: 0 }

    this.set(value, true)
  }

  #guard (value) {
    if (this.#guards === undefined)
      return

    for (const guard of this.#guards) {
      const ok = guard.fit(value, this.#origin)

      if (ok === false)
        throw new EntityGuardException(guard.name, value)
    }
  }

  // deletion is only expressed as a new _deleted timestamp,
  // so committing over a tombstone without touching it means revival
  #revive (value) {
    if (this.#origin?._deleted == null || value._deleted !== this.#origin._deleted)
      return

    value._deleted = null
    this.deleted = false
  }

  #set (value) {
    if (!('_trailers' in value))
      Object.defineProperty(value, '_trailers', {
        writable: false,
        configurable: false,
        enumerable: false,
        value: {}
      })

    if (!('_created' in value)) {
      value._created = Date.now()
      value._updated ??= value._created
    }

    if ('_deleted' in value && value._deleted !== null)
      this.deleted = true

    if (this.#state !== undefined) {
      value._updated = Date.now()
      value._version++
    }

    this.#state = value
  }
}

exports.Entity = Entity
