// noinspection ES6UnusedImports

import { Component } from './component'
import { Locator } from '@toa.io/core/types'

declare namespace toa.formation {

    namespace context {

        interface Runtime {
            version: string
            registry?: string
            proxy?: string
        }

        interface Registry {
            base: string
            platforms?: string[] | null
        }

        interface Composition {
            name: string,
            components: string[] | Component[]
        }

        namespace dependencies {

            type Instance = {
                locator: Locator
                manifest?: Object
            }

            type References = {
                [reference: string]: Component[]
            }

        }

        interface Dependencies {
            [reference: string]: dependencies.Instance[]
        }

        interface Declaration {
            name: string
            description: string
            version: string
            runtime: Runtime | string
            registry: Registry | string
            packages: string
            compositions?: Composition[]
            annotations?: Record<string, object>
        }
    }

    interface Context extends context.Declaration {
        locator: Locator
        runtime: context.Runtime
        environment?: string
        registry: context.Registry
        components: Component[]
        dependencies?: context.Dependencies
    }

}

export type Composition = toa.formation.context.Composition
export type Context = toa.formation.Context

