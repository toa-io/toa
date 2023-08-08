import { type Dependency } from '@toa.io/operations'
import { type Declaration, normalize } from './deployment/annotation'
import * as sources from './deployment/sources'
import { type Instance } from './deployment/instance'

export function deployment (instances: Instance[], declaration: Declaration): Dependency {
  const annotation = normalize(declaration)

  return sources.createDependency(instances, annotation.sources)
}
