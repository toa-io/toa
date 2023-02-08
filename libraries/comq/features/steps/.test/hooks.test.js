'use strict'

const { generate } = require('randomstring')
const { gherkin } = require('@toa.io/libraries/mock')
const mock = { gherkin }

jest.mock('@cucumber/cucumber', () => mock.gherkin)
jest.mock('@toa.io/libraries/comq')

const {
  /** @type {jest.MockedFn<toa.comq.connect>} */
  connect
} = require('@toa.io/libraries/comq')

require('../hooks')

/** @type {toa.comq.features.Context} */
let context

const io = { close: jest.fn(async () => undefined) }

connect.mockImplementation(async () => /** @type {toa.comq.IO} */ io)

beforeEach(() => {
  jest.clearAllMocks()

  context = /** @type {toa.comq.features.Context} */ {}
})

describe('Before', () => {
  const hook = gherkin.steps.Be()

  beforeEach(async () => {
    await hook.call(context)
  })

  it('should connect', async () => {
    expect(connect).toHaveBeenCalledWith('amqp://developer:secret@localhost:5673')
  })

  it('should connect once', async () => {
    await hook.call(context)

    expect(connect).toHaveBeenCalledTimes(1)
  })

  it('should define io in the context', async () => {
    expect(context.io).toBeDefined()
    expect(context.io).toStrictEqual(await connect.mock.results[0].value)
  })
})
