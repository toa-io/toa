import type { Locator } from '@toa.io/core/types'

export namespace toa.norm {

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

    type Entity = {
      storage: string
      schema: Object
      initialized?: boolean
    }

    interface Declaration {
      namespace: string
      name: string
      version: string
      entity: Entity
      extensions?: component.Extensions
    }

    type Constructor = (path: string) => Promise<Component>
  }

  interface Component extends component.Declaration {
    locator: Locator
    path: string
    operations?: component.Operations
    events?: component.Events
  }
}

export type Component = toa.norm.Component
export const component: toa.norm.component.Constructor
