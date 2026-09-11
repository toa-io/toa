import { Deployment, type Request } from './Deployment.ts'
import { normalize } from './annotation.ts'
import type { Variables } from '@toa.io/operations'
import type { Declaration } from './annotation.ts'

export function createVariables(
  id: string,
  declaration: Declaration,
  requests: Request[]
): Variables {
  const annotation = normalize(declaration)
  const deployment = new Deployment(id, annotation)

  return deployment.export(requests)
}
