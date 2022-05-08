import type { Locator } from '@toa.io/core/types'

export namespace toa.formation.component {

    interface Map {
        [id: string]: Component
    }

    interface Component {
        domain: string
        name: string
        version: string
        locator: Locator
        path: string
    }

}

export type Component = toa.formation.component.Component
