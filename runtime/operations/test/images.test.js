'use strict'

const fixtures = require('./images.fixtures')
const mock = fixtures.mock

jest.mock('../src/images/image', () => mock.image)

const { Images } = require('../src')

let images

beforeEach(() => {
  images = new Images(fixtures.context)
})

it('should create Image instances', () => {
  expect(mock.image.Image).toHaveBeenCalledTimes(fixtures.context.manifests.length)

  for (let i = 0; i < fixtures.context.manifests.length; i++) {
    expect(mock.image.Image).toHaveBeenCalledWith(fixtures.context.manifests[i], fixtures.context.registry)
  }
})

describe('push', () => {
  beforeEach(async () => {
    await images.push()
  })

  it('should push images', () => {
    mock.image.Image.mock.results.forEach(({ value: instance }) => {
      expect(instance.build).toHaveBeenCalled()
      expect(instance.push).toHaveBeenCalled()
    })
  })
})
