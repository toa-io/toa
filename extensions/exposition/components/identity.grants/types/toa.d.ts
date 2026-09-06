// Written by `toa types`. Every run rewrites it.
// What a manifest does not state belongs in a file of your own.

import type { Query, RemoteError } from '@toa.io/core/types'
import type { FetchInit } from '@toa.io/extensions.fetch'
import type { Stash } from '@toa.io/extensions.stash'
import type { Logs, Span } from '@toa.io/extensions.telemetry'
import type { Readable } from 'node:stream'

export interface Entity {
  authority: string
  identity: string
  client: string
  scope?: string[]
  resource?: string[]
  /** The identity.keys record backing the access token, revoked with the grant */
  kid?: string
  revokedAt?: number
  id: string
  VERSION?: number
  CREATED?: number
  UPDATED?: number
  DELETED?: number | null
}

export type TransitInput = {
  authority: string
  identity: string
  client: string
  scope?: string[]
  resource?: string[]
  kid?: string
}

export type AuthorizeInput = {
  authority: string
  identity: string
  client: string
  redirect: string
  /** PKCE code challenge, S256 of the verifier */
  challenge: string
  method: string
  scope?: string[]
  resource?: string[]
}

export type AuthorizeOutput = {
  /** Read and removed by `io:status` */
  status?: number
  code?: string
  expires_in?: number
  error?: string
  error_description?: string
}

export type ExchangeInput = {
  authority: string
  grant_type: string
  code?: string
  code_verifier?: string
  redirect_uri?: string
  client_id?: string
  /** A form repeats a name to say a list, so either shape arrives */
  resource?: string | unknown[]
}

export type ExchangeOutput = {
  status?: number
  access_token?: string
  token_type?: string
  expires_in?: number
  scope?: string
  error?: string
  error_description?: string
}

export type ListInput = {
  authority: string
  identity: string
}

export type RevokeInput = {
  authority: string
  identity: string
}

export type RevokeOutput = null

export interface Component {
  transit: (request: { input: TransitInput, query?: Query<Entity>, task?: boolean }) => Promise<Entity>
  authorize: (request: { input: AuthorizeInput, task?: boolean }) => Promise<AuthorizeOutput>
  exchange: (request: { input: ExchangeInput, task?: boolean }) => Promise<ExchangeOutput>
  list: (request: { input: ListInput, task?: boolean }) => Promise<unknown>
  revoke: (request: { input: RevokeInput, query?: Query<Entity>, task?: boolean }) => Promise<RevokeOutput | RemoteError<"NOT_FOUND">>
  assign: (request: { input?: null, query?: Query<Entity>, task?: boolean }) => Promise<Entity>
  ensure: (request: { input?: null, query?: Query<Entity>, task?: boolean }) => Promise<Entity>
  enumerate: (request: { input?: null, query?: Query<Entity>, task?: boolean }) => Promise<Entity[]>
  observe: (request: { input?: null, query?: Query<Entity>, task?: boolean }) => Promise<Entity | null>
  stream: (request: { input?: null, query?: Query<Entity>, task?: boolean }) => Promise<Readable>
  terminate: (request: { input?: null, query?: Query<Entity>, task?: boolean }) => Promise<Entity>
}

export interface Configuration {
  /** Seconds an authorization code may be redeemed within */
  lifetime: number
  /** Seconds an access token is valid for; 0 is until it is revoked */
  token: number
}
