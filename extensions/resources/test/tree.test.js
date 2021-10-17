'use strict'

const { Tree } = require('../src/tree')
const fixtures = require('./tree.fixtures')

let tree

beforeEach(() => {
  tree = new Tree(fixtures.definition)
})

it('should find node', () => {
  expect(tree.match('/12/')).toBeDefined()
  expect(tree.match('/12/segment/')).toBeDefined()
})

it('should return undefined on mismatch', () => {
  expect(tree.match('/12')).not.toBeDefined()
  expect(tree.match('/non/existent/')).not.toBeDefined()
})
