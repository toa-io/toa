import { encode } from 'msgpackr'
import { createVariables, type Request } from '@toa.io/pointer'
import { merge } from '@toa.io/generic'
import { normalize, split, type Annotation, type Properties } from './annotation'
import type { Locator } from '@toa.io/core'
import type { Dependency, Variables } from '@toa.io/operations'
import type { context } from '@toa.io/norm'

export function deployment (instances: Instance[], annotation: Annotation): Dependency {
  normalize(annotation, instances)

  const variables: Variables = {}

  for (const instance of instances) {
    const id = ID_PREFIX + instance.locator.label
    const component = annotation[instance.locator.id]
    const { origins, properties } = split(component)
    const selectors = Object.keys(instance.manifest)
    const request: Request = { group: instance.locator.label, selectors }
    const instanceVariables = createVariables(id, origins, [request])

    merge(variables, instanceVariables)

    const propertiesVariable = createPropertiesVariable(instance.locator, properties)

    merge(variables, propertiesVariable)
  }

  return { variables }
}

export function manifest (manifest: Manifest): Manifest {
  console.log('TEMP: manifest()')

  return manifest
}

function createPropertiesVariable (locator: Locator, properties: Properties): Variables {
  const name = ENV_PREFIX + locator.uppercase + '__PROPERTIES'
  const value = encode(properties).toString('base64')

  return {
    [locator.label]: [
      { name, value }
    ]
  }
}

const ID_PREFIX = 'origins-'
const ENV_PREFIX = 'TOA_ORIGINS_'

export type Manifest = Record<string, string | null>
export type Instance = context.Dependency<Manifest>
