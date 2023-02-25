'use strict'

const { generate } = require('randomstring')
const { gherkin } = require('@toa.io/libraries/mock')
const { command } = require('./command.mock')
const mock = { gherkin, command }

jest.mock('@cucumber/cucumber', () => mock.gherkin)
jest.mock('@toa.io/libraries/command', () => mock.command)

jest.setTimeout(10000)

require('../broker')

const context = {}

beforeEach(() => {
  jest.clearAllMocks()
})

describe('the broker is/has {status}', () => {
  const step = gherkin.steps.Gi('the broker is/has {status}')

  it('should be', async () => undefined)

  beforeEach(() => {
    context.io = generate()
  })

  it('should start comq-rmq container', async () => {
    command.execute.mockImplementationOnce(async () => undefined)
    command.execute.mockImplementationOnce(async () => ({ output: 'healthy' }))

    await step.call(context, 'up')

    expect(command.execute).toHaveBeenCalledWith('docker start comq-rmq')
  })

  it('should wait for healthy state', async () => {
    let starting = false
    let healthy = false

    command.execute.mockImplementationOnce(async () => undefined)

    command.execute.mockImplementationOnce(async () => {
      starting = true

      return { output: 'starting' }
    })

    command.execute.mockImplementationOnce(async () => {
      healthy = true

      return { output: 'healthy' }
    })

    await step.call(context, 'up')

    expect(command.execute).toHaveBeenCalledTimes(3)
  })

  it('should stop comq-rmq container', async () => {
    await step.call(context, 'down')

    expect(command.execute).toHaveBeenCalledWith('docker stop comq-rmq')
  })

  it('should kill comq-rmq container', async () => {
    await step.call(context, 'crashed')

    expect(command.execute).toHaveBeenCalledWith('docker kill comq-rmq')
  })
})
