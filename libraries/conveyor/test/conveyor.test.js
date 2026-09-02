'use strict'

const { it, beforeEach, mock } = require('node:test')
const assert = require('node:assert/strict')
const { isDeepStrictEqual } = require('node:util')

const { generate } = require('randomstring')
const { random } = require('@toa.io/generic')

const { ProcessorException } = require('../source/exceptions')
const { Conveyor } = require('../source')

it('should be', () => {
  assert.notStrictEqual(Conveyor, undefined)
})

let processor

/** @type {toa.conveyor.Conveyor<number, string>} */
let conveyor

// node:test replaces an implementation for one nominated call rather than
// queueing, so each deferral says which invocation it stands for
let queued = 0

beforeEach(() => {
  queued = 0
  processor = mock.fn(() => new Promise(() => {}))
  conveyor = new Conveyor(processor)
})

it('should return response', async () => {
  const unit = random()
  const result = generate()
  const complete = once()
  const promise = conveyor.process(unit)

  complete(result)

  await assert.deepStrictEqual(await promise, result)
})

it('should buffer units while processing', async () => {
  const amount = random(5) + 5
  const units = []
  const results = []
  const promises = []

  const first = once()
  const second = once()

  for (let i = 0; i < amount; i++) {
    const unit = random()
    const result = unit.toString()
    const promise = conveyor.process(unit)

    units.push(unit)
    promises.push(promise)
    results.push(result)
  }

  // first process
  const unit = units.shift()
  const result = results.shift()
  const promise = promises.shift()

  assert.strictEqual(processor.mock.callCount(), 1)
  assert.ok(((call) => call.arguments.length === 1 && isDeepStrictEqual(call.arguments[0], [unit]))(processor.mock.calls[1 - 1] ?? { arguments: [] }))

  first(result)

  await assert.deepStrictEqual(await promise, result)

  // second process
  assert.strictEqual(processor.mock.callCount(), 2)
  assert.ok(((call) => call.arguments.length === 1 && isDeepStrictEqual(call.arguments[0], units))(processor.mock.calls[2 - 1] ?? { arguments: [] }))

  second(results)

  for (let i = 0; i < amount - 1; i++) {
    const promise = promises[i]
    const result = results[i]
    const value = await promise

    assert.deepStrictEqual(value, result)
  }
})

it('should throw if amount of results doesn\'t match amount of units', async () => {
  const amount = random(5) + 5
  const promises = []

  const first = once()
  const second = once()

  for (let i = 0; i < amount; i++) {
    const promise = conveyor.process(random())

    promises.push(promise)
  }

  first([generate()])

  const promise = promises.shift()

  await promise

  second([generate()])

  await assert.rejects(Promise.all(promises), ProcessorException)
})

const once = () => {
  let complete

  processor.mock.mockImplementationOnce(() => new Promise((resolve) => (complete = resolve)), queued++)

  return (result) => complete(result)
}
