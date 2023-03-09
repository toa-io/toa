'use strict'

const { merge, overwrite, newid } = require('@toa.io/generic')
const { EntityContractException } = require('../exceptions')

class Changeset {
  /** @type {toa.core.Query} */
  query

  #schema
  #state

  constructor (schema, query) {
    this.query = query

    this.#schema = schema
    this.#state = schema.system()
  }

  get () {
    return this.#state
  }

  set (value) {
    const error = this.#schema.adapt(value)

    if (error !== null) throw new EntityContractException(error)

    this.#state = value
  }

  export () {
    const changeset = this.#state
    const result = { changeset }
    const insert = merge({ id: newid() }, changeset)
    const error = this.#schema.fit(insert)

    if (error === null) {
      delete insert.id
      result.insert = overwrite(insert, changeset)
    }

    return result
  }
}

exports.Changeset = Changeset
