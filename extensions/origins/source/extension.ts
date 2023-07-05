import { encode } from 'msgpackr'
import { createVariables, type Request } from '@toa.io/pointer'
import { merge } from '@toa.io/generic'
import { normalize, split, type Annotation, type Properties } from './annotation'
import { type Manifest, validate } from './manifest'
import type { Locator } from '@toa.io/core'
import type { Dependency, Variables } from '@toa.io/operations'
import type { context } from '@toa.io/norm'

export function deployment (instances: Instance[], annotation: Annotation): Dependency {
  normalize(annotation, instances)

  const variables: Variables = {}

  for (const instance of instances) {
    const label: string = instance.locator.label
    const id = ID_PREFIX + label
    const component = annotation[instance.locator.id]
    const { origins, properties } = split(component)
    const selectors = Object.keys(instance.manifest)
    const request: Request = { group: label, selectors }
    const instanceVariables = createVariables(id, origins, [request])

    merge(variables, instanceVariables)

    const propertiesVariable = createPropertiesVariable(instance.locator, properties)

    merge(variables, propertiesVariable)
  }

  return { variables }
}

export function manifest (manifest: Manifest): Manifest {
  validate(manifest)

  return manifest
}

function createPropertiesVariable (locator: Locator, properties: Properties): Variables {
  const name = ENV_PREFIX + locator.uppercase + PROPERTIES_SUFFIX
  const value = encode(properties).toString('base64')

  return {
    [locator.label]: [
      { name, value }
    ]
  }
}

export const ID_PREFIX = 'origins-'
export const ENV_PREFIX = 'TOA_ORIGINS_'
export const PROPERTIES_SUFFIX = '__PROPERTIES'

export type Instance = context.Dependency<Manifest>
