import { it, mock as mocking } from 'node:test'
import assert from 'node:assert/strict'

import { generate } from 'randomstring'
import * as _boot from './boot.mock.js'

const mock = {
  boot: _boot
}

mocking.module('@toa.io/boot', { namedExports: mock.boot })

const stage = await import('../src/index.js')

it('should be', () => {
  assert.notStrictEqual(stage.remote, undefined)
})

it('should connect remote', async () => {
  const name = generate()
  const namespace = generate()
  const id = namespace + '.' + name

  const remote = await stage.remote(id)

  assert.ok(mock.boot.remote.mock.callCount() > 0)
  assert.deepStrictEqual(remote, await mock.boot.remote.mock.calls[0].result)
  assert.ok(remote.connect.mock.callCount() > 0)

  const locator = mock.boot.remote.mock.calls[0].arguments[0]

  assert.notStrictEqual(locator, undefined)
  assert.partialDeepStrictEqual(locator, { name, namespace })
})
