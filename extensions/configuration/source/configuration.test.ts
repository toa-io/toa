import { encode } from '@toa.io/generic'
import { Locator } from '@toa.io/core'
import { generate } from 'randomstring'
import { get } from './configuration'
import { type Manifest } from './manifest'

let locator: Locator
let manifest: Manifest

beforeEach(() => {
  locator = new Locator(generate(), generate())
  manifest = { schema: { foo: 'string' } }
})

afterEach(() => {
  for (const name of used)
    process.env[name] = undefined

  used = []
})

it('should read value', async () => {
  manifest.schema = { foo: 'string' }
  const value: object = { foo: generate() }

  set(value)

  const result = get(locator, manifest)

  expect(result).toStrictEqual(value)
})

it('should return empty object if no value set', async () => {
  expect(get(locator, manifest)).toStrictEqual({})
})

it('should substitute secrets', async () => {
  const value: object = { foo: '$BAR' }

  set(value)
  set('bar', '_BAR')

  const result = get(locator, manifest)

  expect(result).toStrictEqual({ foo: 'bar' })
})

it('should use defaults', async () => {
  manifest.schema = { foo: 'string', bar: ['number'], 'baz?': 'string' }
  manifest.defaults = { foo: 'bar', bar: [1] }

  const values = { bar: [2], baz: 'foo' }

  set(values)

  const result = get(locator, manifest)

  expect(result).toStrictEqual({
    foo: 'bar',
    bar: [2],
    baz: 'foo'
  })
})

it('should validate', async () => {
  manifest.schema = { foo: 'hello', bar: 'number' }

  const values = { bar: 5 }

  set(values)

  const result = get(locator, manifest)

  expect(result).toStrictEqual({
    foo: 'hello',
    bar: 5
  })
})

function set (value: object | string, key = locator.uppercase): void {
  const string = typeof value === 'string' ? value : encode(value)
  const name = 'TOA_CONFIGURATION_' + key

  process.env[name] = string

  used.push(name)
}

let used: string[] = []
