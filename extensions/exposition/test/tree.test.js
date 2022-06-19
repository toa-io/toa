'use strict'

const { Tree } = require('../src/tree')
const fixtures = require('./tree.fixtures')

let tree

beforeEach(() => {
  tree = new Tree(() => null)
  tree.update(fixtures.declaration)
})

it('should find node', () => {
  expect(tree.match('/12/')).toBeDefined()
  expect(tree.match('/12/segment/')).toBeDefined()
})

it('should return undefined on mismatch', () => {
  expect(tree.match('/12')).not.toBeDefined()
  expect(tree.match('/non/existent/')).not.toBeDefined()
})

it('should throw on resource conflicts on local dev env', () => {
  const declaration = {
    '/:id': {
      operations: ['observe']
    },
    '/ok': {
      operations: ['transit']
    }
  }

  const env = process.env.TOA_ENV

  process.env.TOA_ENV = 'local'

  tree = new Tree(() => null)

  tree.update(declaration)

  expect(() => tree.match('/ok/')).toThrow(/Ambiguous routes/)

  process.env.TOA_ENV = env
})
