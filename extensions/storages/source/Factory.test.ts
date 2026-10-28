import { after, before, describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { Factory } from './Factory.ts'
import type { Aspect } from './Aspect.ts'

const locator = { name: 'pictures', namespace: 'store' } as any

/*
`remote` is a Space with no key in the environment: making it throws. A process that makes it is a
process that makes a storage none of its components declares.
*/
const ANNOTATION = {
  local: { provider: 'tmp', directory: 'toa-storages-factory' },
  remote: { provider: 'spaces', space: 'remote', region: 'fra1' }
}

describe('the storages a component is given', () => {
  before(() => {
    process.env.TOA_STORAGES = JSON.stringify(ANNOTATION)
  })

  after(() => {
    delete process.env.TOA_STORAGES
  })

  it('are those it declares, and no other is made', async () => {
    const aspect = new Factory().aspect(locator, ['local']) as Aspect

    await aspect.connect()

    assert.doesNotThrow(() => aspect.invoke('local', 'options'))
    assert.throws(
      () => aspect.invoke('remote', 'options'),
      /Storage 'remote' is not defined/
    )
  })

  it('are every storage there is, where it names none', async () => {
    const aspect = new Factory().aspect(locator, []) as Aspect

    await assert.rejects(aspect.connect(), /TOA_STORAGES_REMOTE_ACCESS_KEY_ID/)
  })
})
