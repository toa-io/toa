'use strict'

const { generate } = require('randomstring')

jest.mock('@toa.io/norm', () => ({
  component: () => mockComponent()
}))

const { manifest } = require('./manifest')

const path = generate()

it('should not modify options', async () => {
  const options = { extensions: ['foo', 'bar'] }

  await manifest(path, options)

  expect(options.extensions.length).toStrictEqual(2)
})

function mockComponent () {
  return { name: generate(), namespace: generate() }
}
