import type { Locator } from '@toa.io/core'

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
            domain: string
            name: string
            version: string
            entity: Object
        }
    }

    interface Component extends component.Declaration {
        locator: Locator
        path: string
        operations?: component.Operations
        events?: component.Events
        extensions?: component.Extensions
    }
}

export type Component = toa.formation.Component
