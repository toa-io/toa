import { Underlay } from '@toa.io/libraries.generic/types'

declare namespace toa.bindings.node {

    interface Extensions {
        [key: string]: Function
    }

    type Context = {
        local: Underlay
        remote: Underlay
        extensions: Extensions

        // known extensions
        origins?: Underlay
    }

}
