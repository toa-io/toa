// noinspection JSUnusedGlobalSymbols,ES6UnusedImports

import { Service } from './service'
import { dependencies } from '@toa.io/norm/types/context'

declare namespace toa.deployment {

  namespace dependency {

    type Constructor = (instances: dependencies.Instance[], annotation: any) => Declaration

    type Reference = {
      name: string
      version: string
      repository?: string
      alias?: string
      values?: Object
    }

    type Service = {
      group: string
      name: string
      version: string
      port: number
      ingress?: {
        host: string
        class: string
        annotations?: object
      }
    }

    type Proxy = {
      name: string
      target: string
    }

    type Variable = {
      name: string
      value?: string | number
      secret?: {
        name: string,
        key: string
      }
    }

    type Variables = {
      [key: string]: Variable[]
    }

    type Declaration = {
      references?: Reference[]
      services?: Service[] // dependency.Service
      proxies?: Proxy[]
      variables?: Variables
    }

  }

  type Dependency = {
    references?: dependency.Reference[]
    services?: Service[] // deployment.Service
    proxies?: dependency.Proxy[]
    variables?: dependency.Variables
  }

}

export namespace dependency {
  export type Declaration = toa.deployment.dependency.Declaration
  export type Reference = toa.deployment.dependency.Reference
  export type Service = toa.deployment.dependency.Service
  export type Proxy = toa.deployment.dependency.Proxy
  export type Variables = toa.deployment.dependency.Variables
  export type Variable = toa.deployment.dependency.Variable
}

export type Dependency = toa.deployment.Dependency
