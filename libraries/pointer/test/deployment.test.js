'use strict'

const { encode, letters: { up, down } } = require('@toa.io/libraries/generic')
const mock = require('@toa.io/libraries/mock')

const { deployment } = require('../')

const prefix = 'foo-bar'

/** @type {toa.norm.context.dependencies.Instance[]} */
let instances

/** @type {toa.pointer.deployment.Options} */
let options

beforeEach(() => {
  instances = mock.dependencies.instances()
  options = { prefix }
})

it('should be', () => {
  expect(deployment).toBeInstanceOf(Function)
})

it('should throw if protocol is omitted', () => {
  const annotation = { default: 'no-protocol' }

  expect(() => deployment(instances, annotation, options)).toThrow('Invalid URL')
})

it('should throw if hostname is omitted', () => {
  const annotation = { default: 'amqps:///' }

  expect(() => deployment(instances, annotation, options)).toThrow('must contain a hostname')
})

it('should consider string annotation as default', () => {
  const annotation = 'pg://host0'

  const output = deployment(instances, annotation, options)

  const name = `TOA_${up(prefix)}_POINTER`
  const value = encode({ default: annotation })

  expect(output.variables.global).toStrictEqual(expect.arrayContaining([{ name, value }]))
})

describe('variables', () => {
  it('should export POINTER variable', () => {
    const annotation = { default: 'amqps://host0' }
    const json = JSON.stringify(annotation)
    const value = encode(json)
    const output = deployment(instances, annotation, options)

    expect(output.variables.global).toStrictEqual(expect.arrayContaining([{
      name: `TOA_${up(prefix)}_POINTER`,
      value
    }]))
  })

  it('should export USERNAME and PASSWORD for each entry of URI Set', () => {
    const annotation = {
      default: 'amqps://host0',
      system: 'amqps://host2',
      dummies: 'amqps://host3',
      'dummies.one': 'amqps://host4'
    }

    const expected = []

    const env = `TOA_${up(prefix)}_`
    const sec = `toa-${down(prefix)}-`

    for (const key of Object.keys(annotation)) {
      const label = key.replaceAll('.', '-').toLowerCase()

      for (const property of ['username', 'password']) {
        expected.push({
          name: `${env}${up(label)}_${up(property)}`,
          secret: {
            name: `${sec}${down(label)}`,
            key: property
          }
        })
      }
    }

    const output = deployment(instances, annotation, options)

    expect(output.variables.global).toStrictEqual(expect.arrayContaining(expected))
  })
})
