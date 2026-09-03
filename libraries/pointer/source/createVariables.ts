import { Deployment, type Request } from './Deployment.js'
import { normalize } from './annotation.js'
import type { Variables } from '@toa.io/operations'
import type { Declaration } from './annotation.js'

export function createVariables (id: string, declaration: Declaration, requests: Request[]): Variables {
  const annotation = normalize(declaration)
  const deployment = new Deployment(id, annotation)

  return deployment.export(requests)
}
