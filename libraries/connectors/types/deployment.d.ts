// noinspection ES6UnusedImports

import { dependency } from '@toa.io/operations/types/deployment'
import { dependencies } from '@toa.io/norm/types'
import { URIs } from './uris'

declare namespace toa.connectors {

  type Deployment = (instances: dependencies.Instance[], uris: URIs, prefix: string) => dependency.Declaration

}

export const deployment : toa.connectors.Deployment
