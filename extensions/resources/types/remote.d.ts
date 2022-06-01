// noinspection ES6UnusedImports

import type { Node } from './definitions'

declare namespace toa.extensions.resources {

    namespace remote {
        type Constructor = (domain: string, name: string, definition: Node) => Remote
    }

    interface Remote {
        update(definition: Object): void
    }

}

export type Remote = toa.extensions.resources.Remote
