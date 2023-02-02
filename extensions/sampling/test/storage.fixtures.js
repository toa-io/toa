'use strict'

const { generate } = require('randomstring')

const get = jest.fn(async () => generate())
const find = jest.fn(async () => generate())
const store = jest.fn(async () => true)
const upsert = jest.fn(async () => generate())
const link = jest.fn()

const storage = /** @type {jest.MockedObject<toa.core.Storage>} */ {
  get,
  find,
  store,
  upsert,
  link
}

exports.storage = storage
