import type * as _composition from './composition'
import type * as _service from './service'
import type * as _dependency from './dependency'

declare namespace toa.deployment {

  interface Declaration {
    apiVersion: string
    type: string
    name: string
    description?: string
    version: string
    appVersion: string
    dependencies: _dependency.Reference[]
  }

  interface Contents {
    compositions?: _composition.Composition[]
    components?: string[]
    services?: _service.Service[]
    proxies?: _dependency.Proxy[]
    variables?: _dependency.Variables

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
      namespace?: string
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

    variables(): _dependency.Variables
  }

}

export namespace installation {
  export type Options = toa.deployment.installation.Options
}

export namespace template {
  export type Options = toa.deployment.template.Options
}

export type Deployable = toa.deployment.Deployable
