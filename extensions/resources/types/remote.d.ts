// noinspection ES6UnusedImports

import type * as declarations from './declarations'

declare namespace toa.extensions.resources {

    namespace remotes {

        type Factory = (domain: string, name: string) => Promise<Remote>

    }

    interface Remote {
        update(declaration: declarations.Node): void
    }

}

export type Remote = toa.extensions.resources.Remote
