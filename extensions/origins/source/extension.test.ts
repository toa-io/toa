import { generate } from 'randomstring'
import { Locator } from '@toa.io/core'
import { deployment, type Manifest, type Instance } from './extension'
import { type Annotation } from './annotation'
import type { Dependency } from '@toa.io/operations'

const locator = new Locator(generate(), generate())
const NAMESPACE = locator.namespace.toUpperCase()
const NAME = locator.name.toUpperCase()

it('should create pointer deployment', async () => {
  const manifest: Manifest = { queue: null }
  const instance: Instance = { locator, manifest }
  const url = 'amqp://host-' + generate()

  const annotation: Annotation = {
    [locator.id]: {
      queue: [url]
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
    .toStrictEqual(expected)
})
