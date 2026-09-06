import { describe, it, beforeEach, mock } from 'node:test'
import assert from 'node:assert/strict'

import { Migrations, STATE } from '../src/migrations.js'

let collection
let state
let db
let rows

/** whatever `insertOne` has accepted, keyed as MongoDB would key it */
function stateCollection() {
  return {
    insertOne: mock.fn(async (row) => {
      if (rows.has(row._id)) throw Object.assign(new Error('duplicate'), { code: 11000 })

      rows.set(row._id, { ...row })

      return { insertedId: row._id }
    }),
    findOne: mock.fn(async ({ _id }) => rows.get(_id) ?? null),
    updateOne: mock.fn(async (criteria, { $set }) => {
      const row = rows.get(criteria._id)

      if (row === undefined) return { modifiedCount: 0 }

      for (const [key, value] of Object.entries(criteria))
        if (key !== '_id' && String(row[key]) !== String(value))
          return { modifiedCount: 0 }

      Object.assign(row, $set)

      return { modifiedCount: 1 }
    })
  }
}

beforeEach(() => {
  rows = new Map()

  collection = {
    collectionName: 'test_one',
    createIndex: mock.fn(async () => undefined),
    dropIndex: mock.fn(async () => undefined),
    updateMany: mock.fn(async () => ({ modifiedCount: 2 })),
    deleteMany: mock.fn(async () => ({ deletedCount: 1 }))
  }

  state = stateCollection()
  db = { collection: mock.fn((name) => (name === STATE ? state : null)) }
})

const run = (list) => new Migrations(db, collection, list).run()

describe('steps', () => {
  it('should create an index', async () => {
    await run([
      {
        id: '0001',
        steps: [
          {
            index: {
              name: 'index_a',
              keys: { a: 'asc', b: 'desc', c: 'hash', d: 'text' }
            }
          }
        ]
      }
    ])

    assert.deepEqual(collection.createIndex.mock.calls[0].arguments, [
      { a: 1, b: -1, c: 'hashed', d: 'text' },
      { name: 'index_a' }
    ])
  })

  it('should translate index options', async () => {
    await run([
      {
        id: '0001',
        steps: [
          {
            index: {
              name: 'unique_a',
              keys: { a: 'asc' },
              unique: true,
              sparse: true,
              partial: { a: { $exists: true } },
              ttl: 60
            }
          }
        ]
      }
    ])

    assert.deepEqual(collection.createIndex.mock.calls[0].arguments[1], {
      name: 'unique_a',
      unique: true,
      sparse: true,
      partialFilterExpression: { a: { $exists: true } },
      expireAfterSeconds: 60
    })
  })

  it('should refuse an unknown index option', async () => {
    await assert.rejects(
      run([
        {
          id: '0001',
          steps: [{ index: { name: 'a', keys: { a: 'asc' }, backgorund: true } }]
        }
      ]),
      /unknown index option 'backgorund'/
    )
  })

  it('should refuse an index without keys', async () => {
    await assert.rejects(
      run([{ id: '0001', steps: [{ index: { name: 'a' } }] }]),
      /without a name or keys/
    )
  })

  it('should recreate an index whose declaration changed', async () => {
    let conflicted = false

    collection.createIndex = mock.fn(async () => {
      if (conflicted) return undefined

      conflicted = true

      throw Object.assign(new Error('conflict'), { code: 85 })
    })

    await run([
      { id: '0001', steps: [{ index: { name: 'index_a', keys: { a: 'asc' } } }] }
    ])

    assert.deepEqual(collection.dropIndex.mock.calls[0].arguments, ['index_a'])
    assert.equal(collection.createIndex.mock.callCount(), 2)
    assert.equal(rows.get('test_one:0001').state, 'done')
  })

  it('should not swallow a creation error that is not a conflict', async () => {
    collection.createIndex = mock.fn(async () => {
      throw Object.assign(new Error('nope'), { code: 13 })
    })

    await assert.rejects(
      run([{ id: '0001', steps: [{ index: { name: 'a', keys: { a: 'asc' } } }] }]),
      /nope/
    )
  })

  it('should drop an index', async () => {
    await run([{ id: '0001', steps: [{ dropIndex: { name: 'index_a' } }] }])

    assert.deepEqual(collection.dropIndex.mock.calls[0].arguments, ['index_a'])
  })

  it('should ignore dropping an index that is not there', async () => {
    collection.dropIndex = mock.fn(async () => {
      throw Object.assign(new Error('missing'), { code: 27 })
    })

    await run([{ id: '0001', steps: [{ dropIndex: { name: 'index_a' } }] }])

    assert.equal(rows.get('test_one:0001').state, 'done')
  })

  it('should update', async () => {
    await run([
      {
        id: '0001',
        steps: [{ update: { filter: { a: 1 }, update: { $set: { b: 2 } } } }]
      }
    ])

    assert.deepEqual(collection.updateMany.mock.calls[0].arguments, [
      { a: 1 },
      { $set: { b: 2 } }
    ])
  })

  it('should update every record when no filter is given', async () => {
    await run([{ id: '0001', steps: [{ update: { update: { $set: { b: 2 } } } }] }])

    assert.deepEqual(collection.updateMany.mock.calls[0].arguments[0], {})
  })

  it('should delete', async () => {
    await run([{ id: '0001', steps: [{ delete: { filter: { a: 1 } } }] }])

    assert.deepEqual(collection.deleteMany.mock.calls[0].arguments, [{ a: 1 }])
  })

  it('should refuse deleting without a filter', async () => {
    await assert.rejects(
      run([{ id: '0001', steps: [{ delete: {} }] }]),
      /deletes without a filter/
    )
  })

  it('should refuse a step that is not a verb', async () => {
    await assert.rejects(
      run([{ id: '0001', steps: [{ truncate: {} }] }]),
      /has a step that is not one of/
    )
  })

  it('should refuse a step naming two verbs', async () => {
    await assert.rejects(
      run([{ id: '0001', steps: [{ update: {}, delete: {} }] }]),
      /has a step that is not one of/
    )
  })

  it('should apply steps in order', async () => {
    const order = []

    collection.createIndex = mock.fn(async () => order.push('index'))
    collection.updateMany = mock.fn(async () => {
      order.push('update')
      return { modifiedCount: 0 }
    })

    await run([
      {
        id: '0001',
        steps: [
          { update: { update: {} } },
          { index: { name: 'a', keys: { a: 'asc' } } },
          { update: { update: {} } }
        ]
      }
    ])

    assert.deepEqual(order, ['update', 'index', 'update'])
  })
})

describe('state', () => {
  it('should apply migrations in order', async () => {
    const order = []

    collection.updateMany = mock.fn(async (filter) => {
      order.push(filter.n)
      return { modifiedCount: 0 }
    })

    await run([
      { id: '0001', steps: [{ update: { filter: { n: 1 }, update: {} } }] },
      { id: '0002', steps: [{ update: { filter: { n: 2 }, update: {} } }] }
    ])

    assert.deepEqual(order, [1, 2])
    assert.deepEqual([...rows.keys()], ['test_one:0001', 'test_one:0002'])
  })

  it('should name a row after the collection and the migration', async () => {
    await run([{ id: '0001-indexes', steps: [] }])

    assert.equal(rows.has('test_one:0001-indexes'), true)
  })

  it('should not apply a migration that is done', async () => {
    rows.set('test_one:0001', { _id: 'test_one:0001', state: 'done' })

    await run([{ id: '0001', steps: [{ update: { update: {} } }] }])

    assert.equal(collection.updateMany.mock.callCount(), 0)
  })

  it('should leave the row running where a step throws', async () => {
    collection.updateMany = mock.fn(async () => {
      throw new Error('nope')
    })

    await assert.rejects(
      run([{ id: '0001', steps: [{ update: { update: {} } }] }]),
      /nope/
    )

    assert.equal(rows.get('test_one:0001').state, 'running')
  })

  it('should wait for a claim whose owner is alive', async () => {
    rows.set('test_one:0001', {
      _id: 'test_one:0001',
      state: 'running',
      owner: 'other/1',
      heartbeat: new Date()
    })

    const pending = run([{ id: '0001', steps: [{ update: { update: {} } }] }])
    const settled = await Promise.race([
      pending.then(() => 'done'),
      new Promise((resolve) => setTimeout(() => resolve('waiting'), 1500))
    ])

    assert.equal(settled, 'waiting')
    assert.equal(collection.updateMany.mock.callCount(), 0)

    // let it finish, so the test does not leave a promise polling
    rows.get('test_one:0001').state = 'done'

    await pending
  })

  it('should take over a claim whose owner stopped', async () => {
    rows.set('test_one:0001', {
      _id: 'test_one:0001',
      state: 'running',
      owner: 'dead/1',
      heartbeat: new Date(Date.now() - 60_000)
    })

    await run([{ id: '0001', steps: [{ update: { update: {} } }] }])

    assert.equal(collection.updateMany.mock.callCount(), 1)
    assert.equal(rows.get('test_one:0001').state, 'done')
    assert.notEqual(rows.get('test_one:0001').owner, 'dead/1')
  })

  it('should apply a migration once across concurrent replicas', async () => {
    const list = [{ id: '0001', steps: [{ update: { update: {} } }] }]

    await Promise.all(Array.from({ length: 5 }, () => run(list)))

    assert.equal(collection.updateMany.mock.callCount(), 1)
    assert.equal(rows.size, 1)
  })
})
