'use strict'

const { gherkin } = require('@toa.io/libraries/mock')
const { io } = require('./io.mock')
const mock = { gherkin }

jest.mock('@cucumber/cucumber', () => mock.gherkin)

require('../events')

describe('Given I consume events from {token} exchange as {token}', () => {
  const step = gherkin.steps.Gi('I consume events from {token} exchange as {token}')

  it('should be', async () => undefined)
})
