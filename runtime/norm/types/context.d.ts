import * as _component from './component'
import { Locator } from '@toa.io/core/types'

declare namespace toa.norm {

  namespace context {

    interface Runtime {
      version: string
      registry?: string
      proxy?: string
    }

    interface Registry {
      base?: string
      platforms?: string[] | null
      build?: {
        arguments?: string[]
        run?: string
      },
      credentials: string
    }

    interface Composition {
      name: string,
      components: string[] | _component.Component[]
    }

    namespace dependencies {

      type Instance = {
        locator: Locator
        manifest?: Object
      }

      type References = {
        [reference: string]: _component.Component[]
      }

    }

    interface Dependencies {
      [reference: string]: dependencies.Instance[]
    }

    interface Declaration {
      name: string
      description?: string
      version?: string
      runtime?: Runtime | string
      registry?: Registry | string
      packages?: string
      compositions?: Composition[]
      annotations?: Record<string, object>
    }

    type Constructor = (path: string, environment?: string) => Promise<Context>
  }

  interface Context extends context.Declaration {
    runtime?: context.Runtime
    environment?: string
    registry?: context.Registry
    components?: _component.Component[]
    dependencies?: context.Dependencies
  }

}

export type Composition = toa.norm.context.Composition
export type Context = toa.norm.Context

export namespace dependencies {
  export type Instance = toa.norm.context.dependencies.Instance
}
