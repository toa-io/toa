import { encode } from 'msgpackr'
import { createVariables, type Request } from '@toa.io/pointer'
import { merge } from '@toa.io/generic'
import { normalize, split, type Annotation, type Properties, type Origins } from './annotation'
import { type Manifest, validate } from './manifest'
import type { Locator } from '@toa.io/core'
import type { Dependency, Variables } from '@toa.io/operations'
import type { context } from '@toa.io/norm'

function createInstanceVariables (instance: Instance, origins: Origins) {
  if (instance.manifest === null) return {}

  const label: string = instance.locator.label
  const id = ID_PREFIX + label
  const selectors = Object.keys(instance.manifest)
  const request: Request = { group: label, selectors }

  return createVariables(id, origins, [request])
}

export function deployment (instances: Instance[], annotation: Annotation = {}): Dependency {
  normalize(instances, annotation)

  const variables: Variables = {}

  for (const instance of instances) {
    const component = annotation[instance.locator.id]
    const { origins, properties } = split(component)
    const instanceVariables = createInstanceVariables(instance, origins)
    const propertiesVariable = createPropertiesVariable(instance.locator, properties)

    merge(variables, instanceVariables)
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
