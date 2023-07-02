import { generate } from 'randomstring'
import { encode } from 'msgpackr'
import { Locator } from '@toa.io/core'
import { deployment, type Manifest, type Instance } from './extension'
import { type Annotation, type Properties } from './annotation'
import type { Dependency } from '@toa.io/operations'

const locator = new Locator(generate(), generate())
const NAMESPACE = locator.namespace.toUpperCase()
const NAME = locator.name.toUpperCase()

it('should create deploy pointer variables', async () => {
  const manifest: Manifest = { queue: null }
  const instance: Instance = { locator, manifest }
  const url = 'amqp://host-' + generate()

  const annotation: Annotation = {
    [locator.id]: {
      queue: url
    }
  }

  const deploy = deployment([instance], annotation)

  const expected: Dependency = {
    variables: {
      [locator.label]: [
        {
          name: `TOA_ORIGINS_${NAMESPACE}_${NAME}_QUEUE`,
          value: url
        }
      ]
    }
  }

  expect(deploy)
    .toMatchObject(expected)
})

it('should create deploy default origins', async () => {
  const example = 'http://api.example.com'
  const manifest: Manifest = { example }
  const instance: Instance = { locator, manifest }
  const annotation: Annotation = {}
  const deploy = deployment([instance], annotation)

  const expected: Dependency = {
    variables: {
      [locator.label]: [
        {
          name: `TOA_ORIGINS_${NAMESPACE}_${NAME}_EXAMPLE`,
          value: example
        }
      ]
    }
  }

  expect(deploy)
    .toMatchObject(expected)
})

it('should deploy properties', async () => {
  const manifest: Manifest = {}
  const instance: Instance = { locator, manifest }
  const properties: Properties = {
    '.http': {
      '/^http://api.example.com/': true
    }
  }

  const annotation: Annotation = {
    [locator.id]: properties
  }

  const deploy = deployment([instance], annotation)
  const value = encode(properties).toString('base64')

  const expected: Dependency = {
    variables: {
      [locator.label]: [
        {
          name: `TOA_ORIGINS_${NAMESPACE}_${NAME}__PROPERTIES`,
          value
        }
      ]
    }
  }

  expect(deploy)
    .toMatchObject(expected)
})
