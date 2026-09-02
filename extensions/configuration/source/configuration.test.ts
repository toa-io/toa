import { describe, it, beforeEach, afterEach } from 'node:test'
import assert from 'node:assert/strict'

import { Locator } from '@toa.io/core'
import { generate } from 'randomstring'
import { fit, local, overridden } from './configuration.js'
import { Secret } from './Secret.js'
import { type Manifest } from './manifest.js'

let locator: Locator
let manifest: Manifest

beforeEach(() => {
  locator = new Locator(generate(), generate())
  manifest = {
    schema: {
      type: 'object',
      properties: { foo: { type: 'string' } }
    }
  }
})

afterEach(() => {
  for (const name of used)
    delete process.env[name]

  used = []
})

describe('overridden', () => {
  it('should be false without the variable', async () => {
    assert.deepStrictEqual(overridden(locator), false)
  })

  it('should be true with the variable', async () => {
    set({})

    assert.deepStrictEqual(overridden(locator), true)
  })
})

describe('local', () => {
  it('should read value', async () => {
    const value: object = { foo: generate() }

    set(value)

    assert.deepStrictEqual(local(locator, manifest), value)
  })

  it('should return empty object if no value set', async () => {
    assert.deepStrictEqual(local(locator, manifest), {})
  })

  it('should substitute secrets', async () => {
    set({ foo: '$BAR' })
    set('bar', '_BAR')

    const { foo } = local(locator, manifest)

    assert.ok(foo instanceof Secret)
    assert.deepStrictEqual((foo as Secret).unwrap(), 'bar')
    assert.deepStrictEqual(String(foo), '<REDACTED>')
  })

  it('should substitute secrets in defaults', async () => {
    manifest.defaults = { foo: '$BAR' }

    set('bar', '_BAR')

    assert.deepStrictEqual((local(locator, manifest).foo as Secret).unwrap(), 'bar')
  })

  it('should use defaults', async () => {
    manifest.schema = {
      type: 'object',
      properties: {
        foo: { type: 'string' },
        bar: { type: 'array', items: { type: 'number' } },
        baz: { type: 'string' }
      },
      required: ['foo', 'bar']
    }
    manifest.defaults = { foo: 'bar', bar: [1] }

    set({ bar: [2], baz: 'foo' })

    assert.deepStrictEqual(local(locator, manifest), { foo: 'bar', bar: [2], baz: 'foo' })
  })

  it('should validate', async () => {
    manifest.schema = {
      type: 'object',
      properties: {
        foo: { type: 'string', default: 'hello' },
        bar: { type: 'number' }
      }
    }

    set({ bar: 5 })

    assert.deepStrictEqual(local(locator, manifest), { foo: 'hello', bar: 5 })
  })
})

describe('fit', () => {
  it('should substitute secrets and apply the schema', async () => {
    manifest.schema = {
      type: 'object',
      properties: {
        foo: { type: 'string' },
        bar: { type: 'number', default: 1 }
      }
    }

    set('secret', '_FOO')

    const raw = { foo: '$FOO' }
    const values = fit(raw, manifest)

    assert.deepStrictEqual((values.foo as Secret).unwrap(), 'secret')
    assert.deepStrictEqual(values.bar, 1)
    assert.deepStrictEqual(raw, { foo: '$FOO' }) // untouched
  })

  it('should not apply the manifest defaults', async () => {
    manifest.defaults = { foo: 'hello' }

    assert.deepStrictEqual(fit({}, manifest), {})
  })

  it('should throw on a value not fitting the schema', async () => {
    assert.throws(() => fit({ foo: { nested: true } }, manifest))
  })
})

function set (value: object | string, key = locator.uppercase): void {
  const string = typeof value === 'string' ? value : JSON.stringify(value)
  const name = 'TOA_CONFIGURATION_' + key

  process.env[name] = string

  used.push(name)
}

let used: string[] = []
