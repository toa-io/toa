import { resolve } from 'node:path'
import * as schemas from '@toa.io/schemas'
import { type Instance } from './extension'
import type * as pointer from '@toa.io/pointer'

export function normalize (annotation: Annotation, instances: Instance[]): void {
  schema.validate(annotation)
  mergeDefaults(annotation, instances)
}

export function split (component: Component): {
  origins: pointer.Declaration
  properties: Properties
} {
  const origins: Origins = {}
  const properties: Properties = {}

  for (const [key, value] of Object.entries(component))
    if (key[0] === '.') properties[key as keyof Properties] = value
    else origins[key] = value

  return { origins, properties }
}

function mergeDefaults (annotation: Annotation, instances: Instance[]): void {
  for (const instance of instances) {
    const component = annotation[instance.locator.id] as Origins ?? {}

    annotation[instance.locator.id] = mergeInstance(component, instance)
  }
}

function mergeInstance (origins: Origins, instance: Instance): Component {
  for (const [origin, value] of Object.entries(instance.manifest))
    if (origins[origin] === undefined)
      if (value === null)
        throw new Error(`Origin '${origin}' is not defined for '${instance.locator.id}'`)
      else origins[origin] = value

  return origins
}

const path = resolve(__dirname, '../schemas/annotation.cos.yaml')
const schema = schemas.schema(path)

export type Component = Origins | Properties
export type Annotation = Record<string, Component>
export type Properties = Partial<Record<'.http', Record<string, boolean>>>
export type Origins = Record<string, string | string[]>
