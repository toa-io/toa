// noinspection ES6UnusedImports,JSUnusedGlobalSymbols

import type { Composition } from './composition'
import type { Service } from './service'
import type { dependency } from './dependency'

declare namespace toa.deployment {

  interface Declaration {
    apiVersion: string
    type: string
    name: string
    description?: string
    version: string
    appVersion: string
    dependencies: dependency.Reference[]
  }

  interface Contents {
    compositions?: Composition[]
    components?: string[]
    services?: Service[]
    proxies?: dependency.Proxy[]
    variables?: dependency.Variables

    [key: string]: Object
  }

  namespace installation {

    interface Options {
      wait?: boolean
      target?: string
      namespace?: string
    }

  }

  namespace template {
    interface Options {
      namespace: string
    }
  }

  interface Deployable {
    name: string
    image: string
  }

  interface Deployment {
    export(target: string): Promise<void>

    install(options: installation.Options): Promise<void>

    template(options: template.Options): Promise<string>

    variables(): dependency.Variables
  }

}

export namespace installation {
  export type Options = toa.deployment.installation.Options
}

export namespace template {
  export type Options = toa.deployment.template.Options
}

export type Deployable = toa.deployment.Deployable
