import { it, beforeEach, afterEach } from 'node:test'
import assert from 'node:assert/strict'

import { instance, timeout } from '../source/instance.js'

const KEY = Symbol.for('toa.core.instance')

beforeEach(() => {
  delete globalThis[KEY]
  delete process.env.TOA_INSTANCE
  delete process.env.TOA_ADDRESSED_TIMEOUT
})

afterEach(() => {
  delete globalThis[KEY]
  delete process.env.TOA_INSTANCE
  delete process.env.TOA_ADDRESSED_TIMEOUT
})

it('should generate a name', () => {
  assert.match(instance(), /^[\da-f]{32}$/)
})

it('should keep the name for the life of the process', () => {
  assert.equal(instance(), instance())
})

// a binding and a component loaded against two copies of the package agree on whose name it is
it('should keep the name where every copy of the package reads it', () => {
  const name = instance()

  assert.equal(globalThis[KEY], name)
})

it('should take the name the environment gives', () => {
  process.env.TOA_INSTANCE = 'streams-0'

  assert.equal(instance(), 'streams-0')
})

it('should refuse a name a queue cannot carry', () => {
  process.env.TOA_INSTANCE = 'a name'

  assert.throws(() => instance(), /TOA_INSTANCE 'a name'/)
})

it('should wait 5 seconds by default', () => {
  assert.equal(timeout(), 5000)
})

it('should wait what the context sets', () => {
  process.env.TOA_ADDRESSED_TIMEOUT = '1500'

  assert.equal(timeout(), 1500)
})

it('should fall back where what the context sets is no positive whole number', () => {
  for (const value of ['0', '-1', '1.5', 'soon']) {
    process.env.TOA_ADDRESSED_TIMEOUT = value

    assert.equal(timeout(), 5000)
  }
})
