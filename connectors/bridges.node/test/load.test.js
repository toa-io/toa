import { it, describe } from 'node:test'
import assert from 'node:assert/strict'

import { resolve } from 'node:path'

import * as load from '../src/load.js'

const dummy = (name) => resolve(import.meta.dirname, 'dummies', name)

describe('extensions', () => {
  it('should load a TypeScript module of every kind', async () => {
    const root = dummy('typescript')

    assert.strictEqual(typeof (await load.operation(root, 'fn')).transition, 'function')
    assert.strictEqual(typeof (await load.event(root, 'done')).condition, 'function')
    assert.strictEqual(typeof (await load.guard(root, 'less')).guard, 'function')
  })

  it('should name a module after the file, dots and all', async () => {
    const receiver = await load.receiver(dummy('typescript'), 'store.orders.created')

    assert.strictEqual(typeof receiver.request, 'function')
  })

  it('should load both languages from one component', async () => {
    const modules = await load.operations(dummy('mixed'))

    assert.deepStrictEqual(modules.map(([name]) => name).sort(), ['plain', 'typed'])
  })

  it('should not find what is not there', async () => {
    await assert.rejects(load.operation(dummy('typescript'), 'nope'),
      (error) => /has no operations\/nope/.test(error.message))
  })
})

describe('conflicts', () => {
  it('should refuse two files that resolve to one name', async () => {
    await assert.rejects(load.operation(dummy('conflict'), 'do'), (error) => {
      assert.match(error.message, /has more than one operations\/do/)
      assert.match(error.message, /do\.js and do\.ts/)

      return true
    })
  })

  it('should refuse a collision between two JavaScript extensions', async () => {
    await assert.rejects(load.event(dummy('conflict'), 'done'), (error) => {
      assert.match(error.message, /has more than one events\/done/)
      assert.match(error.message, /done\.js and done\.mjs/)

      return true
    })
  })

  // the collision belongs to the directory, so it is found before any one name is looked up
  it('should refuse before reporting a missing module', async () => {
    await assert.rejects(load.operation(dummy('conflict'), 'nope'),
      (error) => /has more than one operations\/do/.test(error.message))
  })

  it('should refuse a scan of the directory too', async () => {
    await assert.rejects(load.operations(dummy('conflict')),
      (error) => /has more than one operations\/do/.test(error.message))
  })
})
