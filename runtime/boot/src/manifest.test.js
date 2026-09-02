'use strict'

const { it, mock } = require('node:test')
const assert = require('node:assert/strict')

const { generate } = require('randomstring')

mock.module('@toa.io/norm', { namedExports: ({
  component: () => mockComponent()
}) })

const { manifest } = require('./manifest')

const path = generate()

it('should not modify options', async () => {
  const options = { extensions: ['foo', 'bar'] }

  await manifest(path, options)

  assert.deepStrictEqual(options.extensions.length, 2)
})

function mockComponent () {
  return { name: generate(), namespace: generate() }
}
