'use strict'

const clone = require('clone-deep')

const fixtures = require('./replay.translate.message.fixtures')
const { message: translate } = require('../src/.replay/.suite/translate')
const { generate } = require('randomstring')

it('should be', async () => {
  expect(translate).toBeDefined()
})

/** @type {toa.samples.Message} */
let declaration

/** @type {toa.sampling.Message} */
let message

/** @type {toa.sampling.messages.Sample} */
let sample

beforeEach(() => {
  jest.clearAllMocks()

  declaration = clone(fixtures.message)
  message = translate(declaration, fixtures.autonomous, fixtures.component)
  sample = message.sample
})

it('should copy payload', async () => {
  expect(message.payload).toStrictEqual(declaration.payload)
})

it('should copy title', async () => {
  expect(sample.request.title).toStrictEqual(declaration.title)
})

it('should copy autonomous', async () => {
  expect(sample.request.autonomous).toStrictEqual(fixtures.autonomous)
})

it('should copy component', async () => {
  expect(sample.component).toStrictEqual(fixtures.component)
})

it.each(['input', 'query'])('should copy %s to request', async (key) => {
  const value = declaration[key]

  expect(sample.request.request[key]).toStrictEqual(value)
})

it.each(['input', 'query'])('should create request with %s', async (key) => {
  const value = declaration[key]

  delete declaration.request

  const { sample } = translate(declaration, fixtures.autonomous, fixtures.component)

  expect(sample.request.request[key]).toStrictEqual(value)
})

it('should keep request properties', async () => {
  expect(sample.request.storage.current).toMatchObject(fixtures.message.request.current)
})

it('should add `terminate: true` if request is not defined (and sample is autonomous)',
  async () => {
    delete declaration.request

    message = translate(declaration, fixtures.autonomous, fixtures.component)

    expect(message.sample.request.terminate).toStrictEqual(true)
  })

it('should not create undefined keys in request', async () => {
  delete declaration.input

  message = translate(declaration, fixtures.autonomous, fixtures.component)

  expect('input' in message.sample.request.request).toStrictEqual(false)
})

it('should declare sample as authentic', async () => {
  expect(sample.authentic).toStrictEqual(true)
})

describe('validation', () => {
  /** @type {toa.samples.Message} */
  let declaration

  const check = () => translate(declaration, fixtures.autonomous, fixtures.component)

  beforeEach(() => {
    declaration = clone(fixtures.message)
  })

  it('should throw on schema mismatch', async () => {
    // noinspection JSValidateTypes
    declaration.title = { foo: 1 }

    expect(check).toThrow('must be string')
  })

  it('should throw on request schema mismatch', async () => {
    // noinspection JSValidateTypes
    declaration.request = { title: { foo: 1 } }

    expect(check).toThrow('must be string')
  })

  it.each([['input', 'query']])('should throw if request.%s is defined', async (key) => {
    expect.assertions(1)

    declaration[key] = { id: generate() }
    declaration.request = /** @type {toa.samples.Operation} */ { [key]: { id: generate() } }

    expect(() => check()).toThrow('/request')
  })
})
