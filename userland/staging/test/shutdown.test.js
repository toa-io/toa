'use strict'

const { generate } = require('randomstring')

const { mock } = require('./boot.mock')
jest.mock('@toa.io/boot', () => mock.boot)

const stage = require('../')

it('should be', () => {
  expect(stage.shutdown).toBeDefined()
})

it('should disconnect components', async () => {
  const path = generate()
  const component = await stage.component(path)

  await stage.shutdown()

  expect(component.disconnect).toHaveBeenCalled()
})
