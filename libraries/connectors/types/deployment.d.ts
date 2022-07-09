// noinspection ES6UnusedImports

import { Dependency } from '@toa.io/operations/types/deployment'
import { dependencies } from '@toa.io/norm/types'
import { URIs } from './uris'

declare namespace toa.connectors {

  type Deployment = (instances: dependencies.Instance[], uris: URIs, prefix: string) => Dependency

}

export const deployment : toa.connectors.Deployment
