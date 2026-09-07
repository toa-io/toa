import { it, before, describe } from 'node:test'
import assert from 'node:assert/strict'

import { resolve } from 'node:path'
import { define } from '@toa.io/definitions/bridges.node'

it('should be', () => {
  assert.notStrictEqual(define.operations, undefined)
})

const DUMMIES = resolve(import.meta.dirname, 'dummies')
const find = (component) => resolve(DUMMIES, component)

const root = find('one')

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

describe('syntaxes read from the source', () => {
  it('should define a CommonJS module', async () => {
    const operations = await define.operations(find('commonjs'))

    assert.deepStrictEqual(operations.compute, { type: 'computation', scope: 'none' })
    assert.deepStrictEqual(operations.transit, { type: 'transition', scope: 'object' })
  })

  it('should define a default export by the name it declares', async () => {
    const operations = await define.operations(find('default'))

    assert.deepStrictEqual(operations.transit, { type: 'transition', scope: 'object' })
  })

  it('should define an aliased export by the name it is exported as', async () => {
    const operations = await define.operations(find('alias'))

    assert.deepStrictEqual(operations.meter, { type: 'computation', scope: 'none' })
  })

  it('should leave the scope of a computed export to the manifest', async () => {
    const operations = await define.operations(find('wrapped'))

    assert.deepStrictEqual(operations.transit, { type: 'transition' })
  })
})
