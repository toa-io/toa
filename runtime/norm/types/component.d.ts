import type { Locator } from '@toa.io/core/types'

export namespace toa.norm {

  namespace component {
    namespace operations {

      type Type = 'transition' | 'observation' | 'assignment'
      type Scope = 'object' | 'objects' | 'changeset' | 'none'

    }

    interface Map {
      [id: string]: Component
    }

    interface Operation {
      type?: operations.Type
      scope?: operations.Scope
      bindings?: string[]
      input?: any
      output?: any
      error?: any
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

    interface Receiver {
      transition: string
      adaptive: boolean
      conditioned: boolean
      bridge: string
      binding: string
      path: string
    }

    type Entity = {
      schema: Object
      storage?: string
      initialized?: boolean
    }

    interface Declaration {
      prototype: string
      namespace: string
      name: string
      version: string
      entity: Entity
      bindings: string[]
      operations?: Operations
      events?: Events
      receivers: Record<string, Receiver>
      extensions?: Record<string, object>
      properties?: Record<string, object>
    }

    type Constructor = (path: string) => Promise<Component>
  }

  interface Component extends component.Declaration {
    locator: Locator
    path: string
  }
}

export type Component = toa.norm.Component
export type Operation = toa.norm.component.Operation
export type Declaration = toa.norm.component.Declaration

export const component: toa.norm.component.Constructor
