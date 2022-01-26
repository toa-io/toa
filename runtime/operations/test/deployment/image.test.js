'use strict'

const fixtures = require('./image.fixtures')
const mock = fixtures.mock

jest.mock('execa', () => mock.execa)

const { Image } = require('../../src/deployment/image')
const { hash } = require('@toa.io/gears')

let image

beforeEach(() => {
  image = new Image(fixtures.composition, fixtures.context)
})

it('should provide tag', () => {
  const tag = fixtures.context.registry + '/' + fixtures.composition.name + ':' +
    hash(fixtures.composition.components.map((component) => component.locator.id).join(';'))

  expect(image.tag).toEqual(tag)
})
