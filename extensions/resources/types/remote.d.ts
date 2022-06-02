// noinspection ES6UnusedImports

import type * as declarations from './declarations'

declare namespace toa.extensions.resources {

    namespace remote {
        type Constructor = ((domain: string, name: string) => Promise<Remote>) | Function
    }

    interface Remote {
        update(declaration: declarations.Node): void
    }

}

export type Remote = toa.extensions.resources.Remote
