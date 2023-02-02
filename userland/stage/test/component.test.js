'use strict'

const { generate } = require('randomstring')

const mock = {
  boot: require('./boot.mock')
}

jest.mock('@toa.io/boot', () => mock.boot)

const stage = require('../')

it('should be', () => {
  expect(stage.component).toBeDefined()
})

it('should boot component', async () => {
  const path = generate()
  const component = await stage.component(path)

  expect(mock.boot.manifest).toHaveBeenCalledWith(path)
  expect(mock.boot.component).toHaveBeenCalledWith(await mock.boot.manifest.mock.results[0].value)
  expect(component).toStrictEqual(await mock.boot.component.mock.results[0].value)
  expect(component.connect).toHaveBeenCalled()
})
