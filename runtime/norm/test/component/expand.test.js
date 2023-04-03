'use strict'

const clone = require('clone-deep')

const { expand } = require('../../src/.component')
const fixtures = require('./expand.fixtures')

let source

beforeEach(() => {
  source = clone(fixtures.source)
})

it('should expand', () => {
  expand(source)
  expect(source).toMatchObject(fixtures.target)
})

it('should recognize storages.queues', async () => {
  const queues = { foo: 'bar' }

  source.queues = clone(queues)

  expand(source)

  expect(source.queues).toBeUndefined()
  expect(source.properties['@toa.io/storages.queues']).toMatchObject(queues)
})
