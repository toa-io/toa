import { Component } from './component'

declare namespace toa.formation.context {

    interface Runtime {
        version: string
        registry?: string
        proxy?: string
    }

    interface Registry {
        base: string
        platforms?: Array<string>
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

    interface Declaration {
        name: string
        description: string
        version: string
        runtime: Runtime | string
        registry: Registry | string
        packages: string
        compositions: Array<Composition>
        components: Array<Component>
        connectors?: Dependencies
        extensions?: Dependencies
    }

    interface Context extends Declaration {
        runtime: Runtime
        registry: Registry
    }

}

export type Composition = toa.formation.context.Composition
