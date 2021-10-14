'use strict'

const { Tree } = require('../src/tree')
const fixtures = require('./tree.fixtures')

let tree

beforeEach(() => {
  tree = new Tree(fixtures.definition)
})

it('should find node', () => {
  const node = tree.node('/12/')
  expect(node).toBeDefined()
})
