import { Deployment, type Request } from './Deployment'
import { normalize } from './annotation'
import type { Dependency } from '@toa.io/operations'
import type { Declaration } from './annotation'

export function createDeployment
(id: string, declaration: Declaration, requests: Request[]): Dependency {
  const annotation = normalize(declaration)
  const deployment = new Deployment(id, annotation)

  return deployment.export(requests)
}
