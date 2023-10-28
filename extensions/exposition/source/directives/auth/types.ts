import { type Component } from '@toa.io/core'
import { type Maybe } from '@toa.io/types'
import { type Parameter } from '../../RTD'
import type * as http from '../../HTTP'
import type * as directive from '../../Directive'

export interface Directive {
  authorize: (identity: Identity | null, input: Input, parameters: Parameter[]) =>
  boolean | Promise<boolean>

  reply?: (identity: Identity | null) => http.OutgoingMessage

  settle?: (request: Input, response: http.OutgoingMessage) => Promise<void>
}

export interface Identity {
  readonly id: string
  scheme: string
  roles?: string[]
  refresh: boolean
}

export interface Extension {
  identity: Identity | null
}

export interface Ban {
  banned: boolean
}

export type Input = directive.Input & Extension
export type AuthenticationResult = Maybe<{ identity: Identity, refresh: boolean }>

export type Scheme = 'basic' | 'token'
export type Remote = 'basic' | 'tokens' | 'roles' | 'bans'
export type Discovery = Record<Remote, Promise<Component>>
export type Schemes = Record<Scheme, Component>
