'use strict'

const clone = require('clone-deep')

const fixtures = require('./replay.translate.message.fixtures')
const { message: translate } = require('../src/.replay/translate')
const { generate } = require('randomstring')

it('should be', async () => {
  expect(translate).toBeDefined()
})

/** @type {toa.samples.Message} */
const declaration = clone(fixtures.message)

/** @type {toa.sampling.Message} */
let message

/** @type {toa.sampling.messages.Sample} */
let sample

beforeEach(() => {
  jest.clearAllMocks()

  message = translate(declaration, fixtures.autonomous, fixtures.component)
  sample = message.sample
})

it('should copy payload', async () => {
  expect(message.payload).toStrictEqual(declaration.payload)
})

it('should copy title', async () => {
  expect(sample.title).toStrictEqual(declaration.title)
})

it('should copy autonomous', async () => {
  expect(sample.autonomous).toStrictEqual(fixtures.autonomous)
})

it('should copy component', async () => {
  expect(sample.component).toStrictEqual(fixtures.component)
})

it('should copy input and query to request', async () => {
  const input = declaration.input
  const query = declaration.query

  expect(sample.request).toMatchObject({ input, query })
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

  it.each(['input', 'query'])('should throw if request.%s is defined', async (key) => {
    expect.assertions(1)

    declaration[key] = { id: generate() }
    declaration.request = /** @type {toa.samples.Operation} */ { [key]: { id: generate() } }

    try {
      check()
    } catch (exception) {
      expect(exception).toMatchObject({ path: '/request' })
    }
  })
})
