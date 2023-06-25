import { Deployment, type Request } from './Deployment'
import type { Dependency } from '@toa.io/operations'
import type { Declaration } from './annotation'

export function createDeployment
(id: string, declaration: Declaration, requests: Request[]): Dependency {
  const deployment = Deployment.create(id, declaration)

  return deployment.export(requests)
}
