// noinspection ES6UnusedImports

import { Component } from './component'

declare namespace toa.formation {

    namespace context {
        interface Runtime {
            version: string
            registry?: string
            proxy?: string
        }

        interface Registry {
            base: string
            platforms?: string[]
        }

        interface Composition {
            name: string,
            components: string[] | Component[]
        }

        interface Dependency {
            domain: string
            name: string
        }

        interface Dependencies {
            [path: string]: Dependency[]
        }

        interface Declaration {
            name: string
            description: string
            version: string
            runtime: Runtime | string
            registry: Registry | string
            packages: string
            compositions?: Composition[]
            components: Component[]
            connectors?: Dependencies
            extensions?: Dependencies
        }
    }

    interface Context extends context.Declaration {
        runtime: context.Runtime
        registry: context.Registry
    }

}

export type Composition = toa.formation.context.Composition
export type Context = toa.formation.Context

