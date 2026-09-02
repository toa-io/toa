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
  assert.notStrictEqual(stage.component, undefined)
})

it('should boot component', async () => {
  const path = generate()
  const component = await stage.component(path)

  assert.deepStrictEqual(mock.boot.manifest.mock.calls[0].arguments[0], path)
  const manifest = await mock.boot.manifest.mock.calls[0].result

  assert.ok(mock.boot.component.mock.calls.some((call) =>
    call.arguments.length === 1 && isDeepStrictEqual(call.arguments[0], manifest)))
  assert.deepStrictEqual(component, await mock.boot.component.mock.calls[0].result)
  assert.ok(component.connect.mock.callCount() > 0)
})
