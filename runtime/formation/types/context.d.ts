import { Component } from './component'

declare namespace toa.formation.context {

    interface Runtime {
        version: string
        registry?: string
        proxy?: string
    }

    interface Composition {
        name: string,
        components: Array<string | Component>
    }

    interface Dependency {
        domain: string
        name: string
    }

    interface Dependencies {
        [path: string]: Array<Dependency>
    }

    interface Context {
        name: string
        description: string
        version: string
        runtime: string | Runtime
        registry: string
        packages: string
        compositions: Array<Composition>
        components: Array<Component>
        connectors?: Dependencies
        extensions?: Dependencies
    }

}

export type Composition = toa.formation.context.Composition
