'use strict'

const { generate } = require('randomstring')
const { comq } = require('./comq.mock')
const mock = { comq }

jest.mock('@toa.io/libraries/comq', () => mock.comq)

const { Context } = require('../context')

it('should be', async () => {
  expect(Context).toBeDefined()
})

/** @type {comq.features.Context} */
let context

beforeEach(() => {
  jest.clearAllMocks()

  const _ = {}

  // noinspection JSValidateTypes
  context = new Context(_)
})

describe('connect', () => {
  it('should be', async () => {
    expect(context.connect).toBeDefined()
  })

  const url = generate()

  /** @type {jest.MockedObject<comq.IO>} */
  let io

  beforeEach(async () => {
    await context.connect(url)

    io = await comq.connect.mock.results[0].value
  })

  it('should connect', async () => {
    expect(comq.connect).toHaveBeenCalledWith(url)
  })

  it('should not connect twice', async () => {
    await context.connect(url)

    expect(comq.connect).toHaveBeenCalledTimes(1)
  })

  it('should reconnect to another url', async () => {
    const url = generate()

    await context.connect(url)

    expect(io.close).toHaveBeenCalled()

    expect(comq.connect).toHaveBeenCalledTimes(2)
    expect(comq.connect).toHaveBeenCalledWith(url)
  })
})
