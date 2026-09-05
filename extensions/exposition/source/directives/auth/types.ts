import { type Component } from '@toa.io/core'
import { type Maybe } from '@toa.io/core'
import { type Parameter } from '../../RTD/index.js'
import type * as http from '../../HTTP/index.js'
import type * as io from '../../io.js'

export interface Directive {
  priority?: number

  authorize: (
    identity: Identity | null,
    context: Context,
    parameters: Parameter[]
  ) => boolean | Promise<boolean>

  /**
   * Whether this admits the identity where that can be told without a request — which is
   * what describing a method is. `undefined` says it cannot be told: a directive reading a
   * route variable's value or the body has neither here, and one that is not implemented
   * says the same by its absence. Nothing here may have an effect on the request.
   */
  admits?: (
    identity: Identity | null,
    context: Context
  ) => boolean | undefined | Promise<boolean | undefined>

  reply?: (context: Context) => http.OutgoingMessage | null

  settle?: (context: Context, response: http.OutgoingMessage) => Promise<void>
}

export interface Identity {
  readonly id: string
  roles?: string[]
  permissions?: Record<string, string[]>
  scheme: string | null // null for transient identities

  /** The component that verified the credentials; none for a transient identity. */
  provider?: Remote
  refresh: boolean
}

export interface Extension {
  identity: Identity | null

  /** the error code the presented credentials were rejected with, when they were */
  rejection?: string
}

export interface Ban {
  banned: boolean
}

export type Context = io.Input & Extension
export type AuthenticationResult = Maybe<{ identity: Identity, refresh: boolean }>

export type Scheme = 'basic' | 'token' | 'bearer' | 'code' | 'otp'
export type Remote = 'basic' | 'federation' | 'tokens' | 'roles' | 'bans' | 'otp'
export type Discovery = Record<Remote, Promise<Component>>
export type Components = Partial<Record<Remote, Component>>

export type Create = (name: string, value: any, ...args: any[]) => Directive
