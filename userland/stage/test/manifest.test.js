'use strict'

const { it, mock: mocking } = require('node:test')
const assert = require('node:assert/strict')
const { isDeepStrictEqual } = require('node:util')

const { generate } = require('randomstring')

const mock = {
  boot: require('./boot.mock')
}

mocking.module('@toa.io/boot', { namedExports: mock.boot })

const stage = require('../')

it('should be', () => {
  assert.notStrictEqual(stage.manifest, undefined)
})

it('should boot manifest', async () => {
  const path = generate()

  const manifest = await stage.manifest(path)

  assert.ok(mock.boot.manifest.mock.calls.some((call) => call.arguments.length === 1 && isDeepStrictEqual(call.arguments[0], path)))
  assert.deepStrictEqual(manifest, await mock.boot.manifest.mock.calls[0].result)
})
