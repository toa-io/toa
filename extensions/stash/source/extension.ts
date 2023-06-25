import { createDeployment, type URIMap, type Request } from '@toa.io/pointer'
import { Aspect } from './Aspect'
import { Connection } from './Connection'
import type { Locator, extensions } from '@toa.io/core'
import type { context } from '@toa.io/norm'
import type { Dependency } from '@toa.io/operations'

export class Factory implements extensions.Factory {
  public aspect (locator: Locator): extensions.Aspect {
    const url = this.url()
    const connection = new Connection(url, locator)

    return new Aspect(connection)
  }

  private url (): string {
    if (process.env.TOA_DEV === '1') return 'redis://localhost'
    else return ''
  }
}

export function deployment (instances: context.Dependency[], annotation: URIMap): Dependency {
  const requests: Request[] = instances.map(createRequest)

  return createDeployment(ID, annotation, requests)
}

function createRequest (instance: context.Dependency): Request {
  return {
    label: instance.locator.label,
    selectors: [instance.locator.id]
  }
}

const ID = 'stash'
