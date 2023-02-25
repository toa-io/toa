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

  /** @type {jest.MockedObject<comq.IO>} */
  let io

  beforeEach(async () => {
    await context.connect()

    io = await comq.connect.mock.results[0].value
  })

  it('should connect', async () => {
    expect(comq.connect).toHaveBeenCalledWith('amqp://developer:secret@localhost:5673')
  })

  it('should not connect twice', async () => {
    await context.connect()

    expect(comq.connect).toHaveBeenCalledTimes(1)
  })

  it('should reconnect with credentials', async () => {
    const user = generate()
    const password = generate()

    await context.connect(user, password)

    expect(io.close).toHaveBeenCalled()

    expect(comq.connect).toHaveBeenCalledTimes(2)
    expect(comq.connect).toHaveBeenCalledWith(`amqp://${user}:${password}@localhost:5673`)
  })

  it('should store flow event', async () => {
    expect(io.diagnose).toHaveBeenCalledWith('flow', expect.any(Function))

    const listener = io.diagnose.mock.calls[0][1]

    listener()

    expect(context.events.flow).toStrictEqual(true)
  })
})
