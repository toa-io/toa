'use strict'

const { it, mock: mocking } = require('node:test')
const assert = require('node:assert/strict')

const { generate } = require('randomstring')

const mock = {
  boot: require('./boot.mock')
}

mocking.module('@toa.io/boot', { namedExports: mock.boot })

const stage = require('../')

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
