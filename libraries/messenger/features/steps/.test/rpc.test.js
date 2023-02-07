'use strict'

const { gherkin } = require('@toa.io/libraries/mock')
const mock = { gherkin }

jest.mock('@cucumber/cucumber', () => mock.gherkin)

require('../rpc')

describe('Given function {token} is replying {token} request queue', () => {
  const step = mock.gherkin.steps.Gi('function {token} is replying {token} request queue')

  it('should be', () => undefined)
})
