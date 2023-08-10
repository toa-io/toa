import { createVariables, type Request } from '@toa.io/pointer'
import { type component } from '@toa.io/norm'
import { type Dependency } from '@toa.io/operations'
import { type Instance } from './instance'
import { type Annotation } from './annotation'

export function createDependency (sources: Sources, instances: Instance[]): Dependency {
  const requests = []

  for (const instance of instances) {
    const request = createRequest(instance)

    if (request !== null) requests.push(request)
  }

  const variables = createVariables('amqp-sources', sources, requests)

  return { variables }
}

function createRequest (instance: Instance): Request | null {
  const group = instance.locator.label
  const selectors = createSelectors(instance.component)

  if (selectors === null) return null
  else return { group, selectors }
}

function createSelectors (component: component.Component): string[] | null {
  if (component.receivers === undefined) return null

  const sources = Object.values(component.receivers).map((receiver) => receiver.source)

  return sources.filter((source) => source !== undefined) as string[]
}

type Sources = Annotation['sources']
