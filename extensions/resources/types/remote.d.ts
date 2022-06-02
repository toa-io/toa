// noinspection ES6UnusedImports

import type * as definitions from './definitions'

declare namespace toa.extensions.resources {

    namespace remote {
        type Constructor = ((domain: string, name: string) => Promise<Remote>) | Function
    }

    interface Remote {
        update(definition: definitions.Node): void
    }

}

export type Remote = toa.extensions.resources.Remote
