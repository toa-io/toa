import { it, mock } from 'node:test'
import assert from 'node:assert/strict'
import { isDeepStrictEqual } from 'node:util'

import randomstring from 'randomstring'
import { generate } from '../source/index.js'

it('should be', async () => {
  assert.ok(generate instanceof Function)
})

let object

it('should call generator', async () => {
  const generator = /** @type {import('node:test').Mock<any>} */ mock.fn(() => randomstring.generate())

  object = generate(generator)

  const prop = randomstring.generate()
  const value = object[prop]

  assert.ok(generator.mock.callCount() > 0)
  assert.deepStrictEqual(value, generator.mock.calls[0].result)
})

it('should pass segments', async () => {
  const generator = /** @type {import('node:test').Mock<any>} */ mock.fn()

  generator.mock.mockImplementationOnce(() => ({}), generator.mock.callCount())
  generator.mock.mockImplementationOnce(() => 1, generator.mock.callCount() + 1)
  object = generate(generator)

  const value = object.a.b

  assert.strictEqual(generator.mock.callCount(), 2)
  assert.ok(((call) => call.arguments.length === 1 && isDeepStrictEqual(call.arguments[0], ['a', 'b']))(generator.mock.calls[2 - 1] ?? { arguments: [] }))
  assert.deepStrictEqual(value, generator.mock.calls[1].result)
})

it('should pass value', async () => {
  const generator = /** @type {import('node:test').Mock<any>} */ mock.fn(() => undefined)

  object = generate(generator)

  const prop = randomstring.generate()
  const value = randomstring.generate()

  object[prop] = value

  assert.ok(generator.mock.calls.some((call) => call.arguments.length === 2 && isDeepStrictEqual(call.arguments[0], [prop]) && isDeepStrictEqual(call.arguments[1], value)))
})

it('should pass segments and value', async () => {
  const generator = /** @type {import('node:test').Mock<any>} */ mock.fn()
  const value = randomstring.generate()

  generator.mock.mockImplementationOnce(() => ({}))
  object = generate(generator)

  object.a.b = value

  assert.ok(generator.mock.calls.some((call) => call.arguments.length === 2 && isDeepStrictEqual(call.arguments[0], ['a', 'b']) && isDeepStrictEqual(call.arguments[1], value)))
})

it('should pass segments repeatedly', async () => {
  const generator = /** @type {import('node:test').Mock<any>} */ mock.fn(() => ({}))
  const value = randomstring.generate()

  object = generate(generator)
  object.a.b = value

  assert.ok(((call) => call.arguments.length === 1 && isDeepStrictEqual(call.arguments[0], ['a']))(generator.mock.calls[1 - 1] ?? { arguments: [] }))
  assert.ok(((call) => call.arguments.length === 2 && isDeepStrictEqual(call.arguments[0], ['a', 'b']) && isDeepStrictEqual(call.arguments[1], value))(generator.mock.calls[2 - 1] ?? { arguments: [] }))

  object.a.b = value

  assert.ok(((call) => call.arguments.length === 1 && isDeepStrictEqual(call.arguments[0], ['a']))(generator.mock.calls[3 - 1] ?? { arguments: [] }))
  assert.ok(((call) => call.arguments.length === 2 && isDeepStrictEqual(call.arguments[0], ['a', 'b']) && isDeepStrictEqual(call.arguments[1], value))(generator.mock.calls[4 - 1] ?? { arguments: [] }))
})

it('should apply methods with the context', async () => {
  const generator = () => new Set()

  object = generate(generator)

  const size = object.a.size
  const values = object.a.values()

  assert.deepStrictEqual(size, 0)
  assert.deepStrictEqual(Array.from(values), [])
})

for (const [_, Type] of [
  ['Array', Array], ['Set', Set], ['Map', Map], ['Uint8Array', Uint8Array], ['null', null]
])
   it(`should not proxy ${_}`, async () => {
  const generator = /** @type {import('node:test').Mock<any>} */ mock.fn(() => Type?.constructor ? new Type() : Type)

  object = generate(generator)

  assert.strictEqual(object.a?.foo, undefined)
})

it('should not proxy primitive values', async () => {
  const generator = /** @type {import('node:test').Mock<any>} */ mock.fn(() => 1)

  object = generate(generator)

  assert.deepStrictEqual(typeof object.a, 'number')
  assert.strictEqual(object.a?.foo, undefined)
})

it('should preserve methods length', async () => {
  const generator = () => new Set()

  object = generate(generator)

  const set = object.foo

  assert.deepStrictEqual(set.has.length, new Set().has.length)
})
