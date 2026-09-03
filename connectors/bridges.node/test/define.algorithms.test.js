import { it, before } from 'node:test'
import assert from 'node:assert/strict'

import { resolve } from 'node:path'
import * as define from '../src/define/index.js'

it('should be', () => {
  assert.notStrictEqual(define.operations, undefined)
})

const DUMMIES = resolve(import.meta.dirname, 'dummies')
const find = (component) => resolve(DUMMIES, component)

const root = find('one')

/** @type {toa.node.define.algorithms.List} */
let operations

before(async () => {
  operations = await define.operations(root)
})

it('should define', () => {
  assert.notStrictEqual(operations, undefined)
})

it('should find function operations', () => {
  assert.notStrictEqual(operations.fn, undefined)
})

it('should find class operations', () => {
  assert.notStrictEqual(operations.cls, undefined)
})

it('should find factory operations', () => {
  assert.notStrictEqual(operations.fct, undefined)
})
