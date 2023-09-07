import { type Component } from '@toa.io/core'
import { type Nopeable } from 'nopeable'
import { type Parameter } from '../../RTD'
import type * as http from '../../HTTP'
import type * as directive from '../../Directive'

export interface Directive {
  authorize: (identity: Identity | null, input: Input, parameters: Parameter[]) =>
  boolean | Promise<boolean>

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

export type Input = directive.Input & Extension

export type AuthenticationResult = Nopeable<{ identity: Identity, refresh: boolean }>

export type Scheme = 'basic' | 'token'
export type Provider = 'basic' | 'tokens' | 'roles'
export type Discovery = Record<Provider, Promise<Component>>
export type Schemes = Record<Scheme, Component>
