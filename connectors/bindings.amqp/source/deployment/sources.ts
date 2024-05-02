import { createVariables, resolve, type Request } from '@toa.io/pointer'
import { type Manifest } from '@toa.io/norm'
import { type Dependency } from '@toa.io/operations'
import { type Locator } from '@toa.io/core'
import { type Instance } from './instance'
import { type Annotation } from './annotation'

export function createDependency (sources: Sources, instances: Instance[]): Dependency {
  const requests = []

  for (const instance of instances) {
    const request = createRequest(instance)

    if (request !== null) requests.push(request)
  }

  const variables = createVariables(ID, sources, requests)

  return { variables }
}

export async function resolveURIs (locator: Locator): Promise<string[]> {
  return resolve(ID, locator.id)
}

function createRequest (instance: Instance): Request | null {
  const group = instance.locator.label
  const selectors = createSelectors(instance.component)

  if (selectors === null)
    return null
  else
    return { group, selectors }
}

function createSelectors (component: Manifest): string[] | null {
  if (component.receivers === undefined) return null

  const sources = Object.values(component.receivers).map((receiver) => receiver.source)

  return sources.filter((source) => source !== undefined) as string[]
}

const ID = 'amqp-sources'

type Sources = Annotation['sources']
