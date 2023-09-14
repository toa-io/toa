import { type Dependency } from '@toa.io/operations'
import { merge } from '@toa.io/generic'
import { type Declaration, normalize } from './deployment/annotation'
import * as sources from './deployment/sources'
import * as context from './deployment/context'
import { type Instance } from './deployment/instance'

export function deployment (instances: Instance[], declaration: Declaration): Dependency {
  const annotation = normalize(declaration)
  const contextDependency = context.createDependency(annotation.context)
  const sourcesDependency = sources.createDependency(annotation.sources, instances)

  return merge(contextDependency, sourcesDependency)
}
