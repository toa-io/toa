'use strict'

const clone = require('clone-deep')
const { generate } = require('randomstring')
const { Connector } = require('@toa.io/core')
const { sample: pick } = require('@toa.io/libraries/generic')

const fixtures = require('./emitter.fixtures')
const { Emitter } = require('../src/emitter')
const { Factory } = require('../src')
const { ReplayException } = require('../src/exceptions')
const { context } = require('../src/sample')

/** @type {toa.core.extensions.Factory} */
const factory = new Factory()

/** @type {toa.core.bindings.Emitter} */
let emitter

/** @type {string} */
let label

/** @type {toa.sampling.Request} */
let sample

/** @type {toa.core.Message} */
let message

it('should be', async () => {
  expect(Emitter).toBeDefined()
})

beforeEach(() => {
  jest.clearAllMocks()

  label = generate()

  const payload = {
    [generate()]: generate(), [generate()]: generate()
  }

  message = { payload }

  sample = {
    events: {
      [label]: { payload: clone(payload) }
    }
  }

  emitter = factory.emitter(fixtures.emitter, label)
})

it('should be Emitter', async () => {
  expect(emitter).toBeInstanceOf(Emitter)
})

it('should depend on decorated emitter', async () => {
  expect(emitter).toBeInstanceOf(Connector)
  expect(fixtures.emitter.link).toHaveBeenCalledWith(emitter)
})

it('should emit event', async () => {
  await emitter.emit(message)

  expect(fixtures.emitter.emit).toHaveBeenCalled()
  expect(fixtures.emitter.emit).toHaveBeenCalledWith(message)
})

it('should not emit if sample is autonomous', async () => {
  sample.autonomous = true

  await apply()

  expect(fixtures.emitter.emit).not.toHaveBeenCalled()
})

it('should throw if sample does not match', async () => {
  sample.events = { [label]: { payload: { [generate()]: generate() } } }

  await expect(apply()).rejects.toBeInstanceOf(ReplayException)
})

it('should not throw if sample exactly matches', async () => {
  await expect(apply()).resolves.not.toThrow()
})

it('should not throw if sample partially matches', async () => {
  const payload = sample.events[label].payload
  const keys = Object.keys(payload)
  const key = pick(keys)

  delete payload[key]

  await expect(apply()).resolves.not.toThrow()
})

it('should remove matched event sample', async () => {
  await apply()

  expect(label in sample.events).toStrictEqual(false)
})

const apply = async () => {
  await context.apply(sample, async () => {
    await emitter.emit(message)
  })
}
