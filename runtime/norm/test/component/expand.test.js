'use strict'

const clone = require('clone-deep')

const { expand } = require('../../src/.component')
const fixtures = require('./expand.fixtures')

let source

beforeEach(() => {
  source = clone(fixtures.source)
})

it('should expand', async () => {
  await expand(source)
  expect(source).toMatchObject(fixtures.target)
})

it('should derive version from the component contents', async () => {
  await expand(source)

  expect(source.version).toMatch(/^[0-9a-f]{8}$/)
})

it('should keep declared version', async () => {
  source.version = '1.0.0'

  await expand(source)

  expect(source.version).toStrictEqual('1.0.0')
})

it('should recognize storages.queues', async () => {
  const queues = { foo: 'bar' }

  source.queues = clone(queues)

  await expand(source)

  expect(source.queues).toBeUndefined()
  expect(source.properties['@toa.io/storages.queues']).toMatchObject(queues)
})
