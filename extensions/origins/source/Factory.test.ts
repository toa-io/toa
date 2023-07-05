import { Locator } from '@toa.io/core'
import { generate } from 'randomstring'
import { Factory } from './Factory'
import { type Manifest } from './manifest'
import { type Origins, type Properties } from './annotation'

const createHTTP = jest.fn((origins, properties) => generate())
const createAMQP = jest.fn((origins, properties) => generate())

jest.mock('../source/protocols/http', () => ({
  id: 'http',
  protocols: ['http:', 'https:'],
  create: (origins: Origins, properties: Properties) => createHTTP(origins, properties)
}))

jest.mock('../source/protocols/amqp', () => ({
  id: 'amqp',
  protocols: ['amqp:', 'amqps:'],
  create: (origins: Origins, properties: Properties) => createAMQP(origins, properties)
}))

let manifest: Manifest
let factory: Factory

const locator = new Locator(generate(), generate())

beforeEach(() => {
  jest.clearAllMocks()

  factory = new Factory()
})

it('should create aspect', async () => {
  manifest = {
    one: 'http://whatever'
  }

  process.env[`TOA_ORIGINS_${locator.uppercase}_ONE`] = 'http://api.example.com/'

  const aspects = factory.aspect(locator, manifest)

  expect(aspects.length).toStrictEqual(2)

  const origins = {
    one: [process.env[`TOA_ORIGINS_${locator.uppercase}_ONE`]]
  }

  const properties = {}

  expect(createHTTP).toHaveBeenCalledWith(origins, properties)

  process.env[`TOA_ORIGINS_${locator.uppercase}_ONE`] = undefined
})

it('should create aspects with corresponding origins', async () => {
  manifest = {
    one: null,
    two: null
  }

  process.env[`TOA_ORIGINS_${locator.uppercase}_ONE`] = 'https://api.example.com/'
  process.env[`TOA_ORIGINS_${locator.uppercase}_TWO`] = 'amqp://rmq.example.com/'

  factory.aspect(locator, manifest)

  expect(createHTTP).toHaveBeenCalledWith({
    one: [process.env[`TOA_ORIGINS_${locator.uppercase}_ONE`]]
  }, {})

  expect(createAMQP).toHaveBeenCalledWith({
    two: [process.env[`TOA_ORIGINS_${locator.uppercase}_TWO`]]
  }, {})
})

it('should create aspet with properties', async () => {
  manifest = {
    one: null
  }

  process.env[`TOA_ORIGINS_${locator.uppercase}_ONE`] = 'https://api.example.com/'

  /*
  .http:
    /https://\w+.amazon.com/: true
   */
  process.env[`TOA_ORIGINS_${locator.uppercase}__PROPERTIES`] =
    '3gABpS5odHRw3gABui9odHRwczpcL1wvXHcrLmFtYXpvbi5jb20vww=='

  factory.aspect(locator, manifest)

  expect(createHTTP).toHaveBeenCalledWith({
    one: [process.env[`TOA_ORIGINS_${locator.uppercase}_ONE`]]
  }, {
    '/https:\\/\\/\\w+.amazon.com/': true
  })
})
