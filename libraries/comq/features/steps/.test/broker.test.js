'use strict'

const { gherkin } = require('@toa.io/libraries/mock')
const { command } = require('./command.mock')
const mock = { gherkin, command }

jest.mock('@cucumber/cucumber', () => mock.gherkin)
jest.mock('@toa.io/libraries/command', () => mock.command)

require('../broker')

const context = {}

beforeEach(() => {
  jest.clearAllMocks()
})

describe('RabbitMQ broker is {status}', () => {
  const step = gherkin.steps.Gi('RabbitMQ broker is {status}')

  it('should be', async () => undefined)

  it('should start comq-rmq container', async () => {
    await step.call(context, 'up')

    expect(command.execute).toHaveBeenCalledWith('docker start comq-rmq')
  })

  it('should stop comq-rmq container', async () => {
    await step.call(context, 'down')

    expect(command.execute).toHaveBeenCalledWith('docker stop comq-rmq')
  })
})
