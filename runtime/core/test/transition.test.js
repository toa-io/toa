'use strict'

const fixtures = require('./operation.fixtures')
const mock = fixtures.mock

jest.mock('../src/operation', () => ({ Operation: mock }))

const { Transition } = require('../src/transition')

let transition

beforeEach(() => {
  jest.clearAllMocks()
  transition = new Transition(fixtures.cascade, fixtures.subject, fixtures.contract, fixtures.query)
})

it('should provide initial state', async () => {
  const context = await transition.preprocess({})
  const subject = fixtures.subject.init.mock.results[0].value

  expect(context.subject).toBe(subject)
  expect(context.state).toBe(subject.get.mock.results[0].value)
})

it('should commit', async () => {
  const subject = fixtures.subject.query()
  const state = { bar: 2 }
  const reply = { baz: 3 }
  const context = { subject, state }

  await transition.postprocess(context, reply)

  expect(subject.set).toHaveBeenCalledWith(state)
  expect(fixtures.subject.commit).toHaveBeenCalledWith(subject)
})

it('should not commit if state is null', async () => {
  const state = null
  const reply = { baz: 3 }
  const context = { state }

  await transition.postprocess(context, reply)

  expect(fixtures.subject.commit).not.toHaveBeenCalledWith()
})

it('should not commit if reply contains error', async () => {
  const state = { foo: 1 }
  const reply = { baz: 3, error: {} }
  const context = { state }

  await transition.postprocess(context, reply)

  expect(fixtures.subject.commit).not.toHaveBeenCalledWith()
})
