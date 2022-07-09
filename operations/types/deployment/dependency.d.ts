// noinspection JSUnusedGlobalSymbols,ES6UnusedImports

import { Service } from './service'
import { dependencies } from '@toa.io/norm/types/context'

declare namespace toa.deployment {

  namespace dependency {

    type Constructor = (instances: dependencies.Instance[], annotation: any) => Declaration

    interface Reference {
      name: string
      version: string
      repository?: string
      alias?: string
      values?: Object
    }

    interface Service {
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

    interface Proxy {
      name: string
      target: string
    }

    interface Variable {
      name: string
      value: string
    }

    interface Variables {
      [key: string]: Variable[]
    }

    interface Declaration {
      references?: Reference[]
      services?: Service[] // dependency.Service
      proxies?: Proxy[]
      variables?: Variables
    }

  }

  interface Dependency {
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
}

export type Dependency = toa.deployment.Dependency
