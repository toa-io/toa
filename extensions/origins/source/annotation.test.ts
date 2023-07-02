import { generate } from 'randomstring'
import { Locator } from '@toa.io/core'
import { type Annotation, type Component, split, normalize } from './annotation'
import { type Instance } from './extension'

let annotation: Annotation
let instances: Instance[]
let component: Component

const locator = new Locator(generate(), generate())

beforeEach(() => {
  instances = []
})

describe('normalize', () => {
  it('should throw if a key is not a component ID', async () => {
    annotation = {
      dummies: {
        one: 'amqp://host{0,2}-' + generate()
      }
    }

    expect(run)
      .toThrow('additional properties')
  })

  it('should not throw if valid', async () => {
    annotation = {
      'dummies.dummy': {
        '.http': {
          '/.*hackers.*/': false
        },
        one: 'amqp://host{0,2}-' + generate(),
        two: [
          'amqp://hostA-' + generate(),
          'amqp://hostB-' + generate()
        ]
      }
    }

    expect(run).not.toThrow()
  })

  it('should merge defaults', async () => {
    annotation = {}

    const one = 'http://api.' + generate()

    instances.push({
      locator,
      manifest: { one }
    })

    run()

    expect(annotation)
      .toStrictEqual({
        [locator.id]: { one }
      })
  })

  it('should thow if null origin is not defined', async () => {
    annotation = {}

    instances.push({
      locator,
      manifest: {
        one: null
      }
    })

    expect(run)
      .toThrow('is not defined for')
  })

  it('should not thow if null origin is defined', async () => {
    annotation = {
      [locator.id]: {
        one: 'http://api.' + generate()
      }
    }

    instances.push({
      locator,
      manifest: {
        one: null
      }
    })

    expect(run)
      .not.toThrow()
  })
})

describe('split', () => {
  it('should split', async () => {
    const one = 'amqp://host{0,2}-' + generate()

    component = {
      '.http': {
        '/.*hackers.*/': false
      },
      one
    }

    const { origins, properties } = split(component)

    expect(origins)
      .toStrictEqual({ one })

    expect(properties)
      .toStrictEqual({ '.http': component['.http'] })
  })
})

function run (): void {
  normalize(annotation, instances)
}
