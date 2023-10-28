import { resolve } from 'node:path'
import * as schemas from '@toa.io/schemas'
import { type Protocol, protocols } from './protocols'
import type { Instance } from './extension'

export function normalize (instances: Instance[], annotation: Annotation): void {
  schema.validate(annotation)
  mergeDefaults(annotation, instances)
  checkProtocols(annotation)
}

export function split (component: Component): {
  origins: Origins
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
  if (instance.manifest === null) return origins

  for (const [origin, value] of Object.entries(instance.manifest))
    if (origins[origin] === undefined)
      if (value === null)
        throw new Error(`Origin '${origin}' is not defined for '${instance.locator.id}'`)
      else origins[origin] = value

  return origins
}

function checkProtocols (annotation: Annotation): void {
  for (const component of Object.values(annotation)) {
    const { origins } = split(component)
    const urlSets = Object.values(origins)

    for (const urls of urlSets)
      checkURLs(Array.isArray(urls) ? urls : [urls])
  }
}

function checkURLs (urls: string[]): void {
  let id: string | null = null

  for (const url of urls) {
    const protocol = resolveProtocol(url)

    if (id === null) id = protocol.id
    else if (id !== protocol.id)
      throw new Error(`Origin has inconsistent protocols: ${id}, ${protocol.id}`)
  }
}

function resolveProtocol (reference: string): Protocol {
  const url = new URL(reference)

  for (const protocol of protocols)
    if (protocol.protocols.includes(url.protocol)) return protocol

  throw new Error(`Protocol '${url.protocol}' is not supported.`)
}

const path = resolve(__dirname, '../schemas/annotation.cos.yaml')
const schema = schemas.schema(path)

export type Component = Origins | Properties
export type Annotation = Record<string, Component>
export type Properties = Partial<Record<'.http', Record<string, boolean>>>
export type Origins = Record<string, string | string[]>
