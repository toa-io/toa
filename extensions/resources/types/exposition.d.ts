// noinspection ES6UnusedImports

import type { Remote } from './remote'

declare namespace toa.extensions.resources {

    namespace exposition {

        type Remotes = Record<string, Promise<Remote>>

    }

}
