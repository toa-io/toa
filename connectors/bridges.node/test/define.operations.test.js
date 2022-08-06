'use strict'

const { resolve } = require('node:path')
const define = require('../src/define')

it('should be', () => {
  expect(define.operations).toBeDefined()
})

const DUMMIES = resolve(__dirname, 'dummies')
const find = (component) => resolve(DUMMIES, component)

const root = find('one')

/** @type {toa.node.define.operations.List} */
let operations

beforeAll(async () => {
  operations = await define.operations(root)
})

it('should be', () => {
  expect(operations).toBeDefined()
})

it('should find function operations', () => {
  expect(operations.fn).toBeDefined()
})

it('should find class operations', () => {
  expect(operations.cls).toBeDefined()
})

it('should find factory operations', () => {
  expect(operations.fct).toBeDefined()
})
