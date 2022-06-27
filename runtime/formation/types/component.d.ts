import type { Locator } from '@toa.io/core/types'

export namespace toa.formation {

    namespace component {
        interface Map {
            [id: string]: Component
        }

        interface Operation {
            bindings: string[]
        }

        interface Operations {
            [key: string]: Operation
        }

        interface Event {
            binding: string
        }

        interface Events {
            [key: string]: Event
        }

        interface Extensions {
            [key: string]: Object
        }

        interface Brief {
            locator: Locator
        }

        interface Declaration {
            namespace: string
            name: string
            version: string
            entity: Object
            extensions?: component.Extensions
        }
    }

    interface Component extends component.Declaration {
        locator: Locator
        path: string
        operations?: component.Operations
        events?: component.Events
    }
}

export type Component = toa.formation.Component
export type Brief = toa.formation.component.Brief
