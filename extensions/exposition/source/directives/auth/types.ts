import { type Component } from '@toa.io/core'
import { type Maybe } from '@toa.io/types'
import { type Parameter } from '../../RTD'
import type * as http from '../../HTTP'
import type * as io from '../../io'

export interface Directive {
  priority?: number

  authorize: (
    identity: Identity | null,
    context: Context,
    parameters: Parameter[]
  ) => boolean | Promise<boolean>

  reply?: (context: Context) => http.OutgoingMessage | null

  settle?: (context: Context, response: http.OutgoingMessage) => Promise<void>
}

export interface Identity {
  readonly id: string
  roles?: string[]
  permissions?: Record<string, string[]>
  scheme: string | null // null for transient identities
  refresh: boolean
}

export interface Extension {
  identity: Identity | null
}

export interface Ban {
  banned: boolean
}

export type Context = io.Input & Extension
export type AuthenticationResult = Maybe<{ identity: Identity, refresh: boolean }>

export type Scheme = 'basic' | 'token' | 'bearer'
export type Remote = 'basic' | 'federation' | 'tokens' | 'roles' | 'bans'
export type Discovery = Record<Remote, Promise<Component>>
export type Schemes = Record<Scheme, Component>

export type Create = (name: string, value: any, ...args: any[]) => Directive
