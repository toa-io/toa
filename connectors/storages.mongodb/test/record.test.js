import { describe, it } from 'node:test'
import assert from 'node:assert/strict'

import { to, from, codec } from '../src/record.js'

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

describe('codec', () => {
  const properties = {
    settled: { type: 'string', format: 'date-time' },
    endpoint: { type: 'string' }
  }

  it('should hold a plain record where the entity declares no date', () => {
    const { to: write, from: read, dates } = codec({ endpoint: { type: 'string' } })

    assert.deepStrictEqual(dates, [])
    assert.strictEqual(write, to)
    assert.strictEqual(read, from)
  })

  it('should write a date-time property as a date', () => {
    const { to: write } = codec(properties)
    const record = write({ id: '1', settled: '2026-09-05T10:00:00.000Z', endpoint: 'a.b.c' })

    assert.ok(record.settled instanceof Date)
    assert.strictEqual(record.settled.toISOString(), '2026-09-05T10:00:00.000Z')
    assert.strictEqual(record.endpoint, 'a.b.c', 'and leaves every other property alone')
  })

  it('should read a date back as the string the entity carries', () => {
    const { from: read } = codec(properties)
    const entity = read({ _id: '1', settled: new Date('2026-09-05T10:00:00.000Z') })

    assert.strictEqual(entity.settled, '2026-09-05T10:00:00.000Z')
  })

  it('should leave a property that has not been written to', () => {
    const { to: write, from: read } = codec(properties)

    assert.strictEqual(write({ id: '1', settled: null }).settled, null)
    assert.strictEqual(read({ _id: '1' }).settled, undefined)
  })

  it('should read a record written before the property was declared a date', () => {
    const { from: read } = codec(properties)

    assert.strictEqual(read({ _id: '1', settled: 'not a date' }).settled, 'not a date')
  })

  it('should not modify argument', () => {
    const { to: write } = codec(properties)
    const entity = { id: '1', settled: '2026-09-05T10:00:00.000Z' }

    write(entity)

    assert.strictEqual(entity.settled, '2026-09-05T10:00:00.000Z')
  })

  it('should ignore a format said of the wrong type', () => {
    assert.deepStrictEqual(codec({ at: { type: 'string', format: 'epoch-millis' } }).dates, [])
    assert.deepStrictEqual(codec({ at: { type: 'integer', format: 'date-time' } }).dates, [])
  })
})

describe('codec, epoch-millis', () => {
  const properties = {
    DELETED: { type: 'integer', format: 'epoch-millis' },
    VERSION: { type: 'integer' }
  }

  const millis = 1788698804112

  it('should write milliseconds as a date', () => {
    const record = codec(properties).to({ id: '1', DELETED: millis, VERSION: 2 })

    assert.ok(record.DELETED instanceof Date)
    assert.strictEqual(record.DELETED.getTime(), millis)
    assert.strictEqual(record.VERSION, 2, 'and leaves a plain integer alone')
  })

  it('should read a date back as milliseconds', () => {
    const entity = codec(properties).from({ _id: '1', DELETED: new Date(millis) })

    assert.strictEqual(entity.DELETED, millis)
  })

  it('should leave the null of a record that is not deleted', () => {
    assert.strictEqual(codec(properties).to({ id: '1', DELETED: null }).DELETED, null)
    assert.strictEqual(codec(properties).from({ _id: '1', DELETED: null }).DELETED, null)
  })

  it('should read a record written before the property was a date', () => {
    assert.strictEqual(codec(properties).from({ _id: '1', DELETED: millis }).DELETED, millis)
  })
})
