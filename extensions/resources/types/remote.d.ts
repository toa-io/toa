// noinspection ES6UnusedImports

import type * as definitions from './definitions'

declare namespace toa.extensions.resources {

    namespace remote {
        type Constructor = (domain: string, name: string, definition: definitions.Node) => Remote
    }

    interface Remote {
        update(definition: definitions.Node): void
    }

}

export type Remote = toa.extensions.resources.Remote
