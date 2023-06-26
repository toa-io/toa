import { createDeployment, type Request, type URIMap } from '@toa.io/pointer'
import type { Dependency, Variables } from '@toa.io/operations'
import type { context } from '@toa.io/norm'

export function deployment (instances: Instances, annotation: Declaration): Dependency {
  const variables: Variables = {}

  const requests: Request[] = [{ label: '', selectors: [''] }]

  createDeployment(ID, annotation as unknown as URIMap, requests)

  return { variables }
}

const ID = 'origins'

export type Declaration = any
export type Manifest = Record<string, string | null>
export type Instance = context.Dependency<Manifest>
export type Instances = Instance[]
