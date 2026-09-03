import { type Dependency } from '@toa.io/operations'
import { merge } from '@toa.io/generic'
import { type Declaration, normalize } from './deployment/annotation.js'
import * as sources from './deployment/sources.js'
import * as context from './deployment/context.js'
import { type Instance } from './deployment/instance.js'

export function deployment (instances: Instance[], declaration: Declaration): Dependency {
  const annotation = normalize(declaration)
  const contextDependency = context.createDependency(annotation.context)
  const sourcesDependency = sources.createDependency(annotation.sources, instances)

  return merge(contextDependency, sourcesDependency)
}
