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
    expect(overridden(locator)).toStrictEqual(false)
  })

  it('should be true with the variable', async () => {
    set({})

    expect(overridden(locator)).toStrictEqual(true)
  })
})

describe('local', () => {
  it('should read value', async () => {
    const value: object = { foo: generate() }

    set(value)

    expect(local(locator, manifest)).toStrictEqual(value)
  })

  it('should return empty object if no value set', async () => {
    expect(local(locator, manifest)).toStrictEqual({})
  })

  it('should substitute secrets', async () => {
    set({ foo: '$BAR' })
    set('bar', '_BAR')

    const { foo } = local(locator, manifest)

    expect(foo).toBeInstanceOf(Secret)
    expect((foo as Secret).unwrap()).toStrictEqual('bar')
    expect(String(foo)).toStrictEqual('<REDACTED>')
  })

  it('should substitute secrets in defaults', async () => {
    manifest.defaults = { foo: '$BAR' }

    set('bar', '_BAR')

    expect((local(locator, manifest).foo as Secret).unwrap()).toStrictEqual('bar')
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

    expect(local(locator, manifest)).toStrictEqual({ foo: 'bar', bar: [2], baz: 'foo' })
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

    expect(local(locator, manifest)).toStrictEqual({ foo: 'hello', bar: 5 })
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

    expect((values.foo as Secret).unwrap()).toStrictEqual('secret')
    expect(values.bar).toStrictEqual(1)
    expect(raw).toStrictEqual({ foo: '$FOO' }) // untouched
  })

  it('should not apply the manifest defaults', async () => {
    manifest.defaults = { foo: 'hello' }

    expect(fit({}, manifest)).toStrictEqual({})
  })

  it('should throw on a value not fitting the schema', async () => {
    expect(() => fit({ foo: { nested: true } }, manifest)).toThrow()
  })
})

function set (value: object | string, key = locator.uppercase): void {
  const string = typeof value === 'string' ? value : JSON.stringify(value)
  const name = 'TOA_CONFIGURATION_' + key

  process.env[name] = string

  used.push(name)
}

let used: string[] = []
