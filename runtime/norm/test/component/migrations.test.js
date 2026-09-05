import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { join } from 'node:path'

import { migrations } from '../../src/.component/index.js'

const DUMMIES = join(import.meta.dirname, 'dummies/migrations')

const entity = () => ({ entity: { schema: { properties: {} } } })

describe('migrations', () => {
  it('should read a directory of migrations', async () => {
    const manifest = entity()

    await migrations(join(DUMMIES, 'ordered'), manifest)

    assert.deepEqual(manifest.entity.migrations.map(({ id }) => id),
      ['0001-first', '0002-second', '0010-third'])
  })

  it('should read whatever extension each was written with', async () => {
    const manifest = entity()

    await migrations(join(DUMMIES, 'ordered'), manifest)

    assert.deepEqual(manifest.entity.migrations[0].steps,
      [{ index: { name: 'index_a', keys: { a: 'asc' } } }])
    assert.deepEqual(manifest.entity.migrations[2].steps, [{ delete: { filter: {} } }])
  })

  it('should leave a component with no migrations alone', async () => {
    const manifest = entity()

    await migrations(join(DUMMIES, 'nothing-here'), manifest)

    assert.equal(manifest.entity.migrations, undefined)
  })

  it('should refuse two files resolving to one id', async () => {
    await assert.rejects(migrations(join(DUMMIES, 'conflicting'), entity()),
      /has more than one migrations\/0001-one/)
  })

  it('should refuse migrations on a component that stores nothing', async () => {
    await assert.rejects(migrations(join(DUMMIES, 'stateless'), {}),
      /declares migrations but stores nothing/)
  })

  it('should refuse a migration that is not a list of steps', async () => {
    await assert.rejects(migrations(join(DUMMIES, 'malformed'), entity()),
      /is not a list of steps/)
  })
})
