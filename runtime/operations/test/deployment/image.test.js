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
  const tag = fixtures.composition.components.map(
    (component) => component.locator.id + ':' + component.version).join(';')

  const uri = fixtures.context.registry + '/' + fixtures.composition.name + ':' +
    hash(fixtures.context.runtime.version + ';' + tag)

  expect(image.tag).toEqual(uri)
})
