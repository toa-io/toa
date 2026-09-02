'use strict'

const { it, mock: mocking } = require('node:test')
const assert = require('node:assert/strict')

const { generate } = require('randomstring')

const mock = {
  boot: require('./boot.mock')
}

mocking.module('@toa.io/boot', { namedExports: mock.boot })

const stage = require('../')

const paths = [generate(), generate()]

it('should be', () => {
  assert.notStrictEqual(stage.composition, undefined)
})

it('should boot composition', async () => {
  await stage.composition(paths)

  assert.deepStrictEqual(mock.boot.composition.mock.calls[0].arguments[0], paths)

  const composition = await mock.boot.composition.mock.calls[0].result

  assert.ok(composition.connect.mock.callCount() > 0)
})
