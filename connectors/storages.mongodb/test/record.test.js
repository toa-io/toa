import { describe, it } from 'node:test'
import assert from 'node:assert/strict'

import { to, from } from '../src/record.js'

describe('to', () => {
  it('should rename id to _id', () => {
    /** @type {import('@toa.io/core/types').storages.Record} */
    const entity = {
      id: '1',
      VERSION: 0
    }
    const record = to(entity)

    assert.partialDeepStrictEqual(record, { _id: '1' })
  })

  it('should not modify argument', () => {
    /** @type {import('@toa.io/core/types').storages.Record} */
    const entity = {
      id: '1',
      VERSION: 0
    }

    to(entity)

    assert.deepStrictEqual(entity, {
      id: '1',
      VERSION: 0
    })
  })
})

describe('from', () => {
  it('should rename _id to id', () => {
    /** @type {toa.mongodb.Record} */
    const record = {
      _id: '1',
      VERSION: 0
    }
    const entity = from(record)

    assert.deepStrictEqual(entity, {
      id: '1',
      VERSION: 0
    })
  })
})
