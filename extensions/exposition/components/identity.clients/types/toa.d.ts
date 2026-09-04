// Written by `toa types`. Every run rewrites it.
// What a manifest does not state belongs in a file of your own.

import type { Query, RemoteError } from '@toa.io/core'
import type { FetchInit } from '@toa.io/extensions.fetch'
import type { Stash } from '@toa.io/extensions.stash'
import type { Logs, Span } from '@toa.io/extensions.telemetry'
import type { Readable } from 'node:stream'

export interface Entity {
  authority: string
  /** client_name */
  name?: string
  /** redirect_uris */
  uris: string[]
  /** client_uri */
  uri?: string
  /** logo_uri */
  logo?: string
  scope?: string
  /** When a registration nothing has used is swept */
  expires?: number
  id: string
  _version?: number
  _created?: number
  _updated?: number
  _deleted?: number | null
}

export type TransitInput = {
  authority: string
  name?: string
  uri?: string
  logo?: string
  scope?: string
  uris: string[]
  expires?: number
}

export type RegisterInput = {
  authority: string
  client_name?: string
  client_uri?: string
  logo_uri?: string
  redirect_uris: string[]
  scope?: string
  grant_types?: string[]
  response_types?: string[]
  token_endpoint_auth_method?: string
}

export type RegisterOutput = {
  /** Read and removed by `map:status` */
  status?: number
  client_id?: string
  client_id_issued_at?: number
  client_name?: string
  client_uri?: string
  logo_uri?: string
  redirect_uris?: string[]
  grant_types?: string[]
  response_types?: string[]
  token_endpoint_auth_method?: string
  error?: string
  error_description?: string
}

export type DescribeInput = {
  authority: string
  /** client_id, which is an https URL when the client publishes its own metadata */
  id: string
  /** Asked about together with the client, since only this component may answer it */
  redirect?: string
}

export type DescribeOutput = {
  client_id?: string
  client_name?: string
  client_uri?: string
  logo_uri?: string
  redirect_uris?: string[]
  /** Whether `redirect` is one this client may receive a code at */
  permitted?: boolean
}

export interface Component {
  transit: (request: { input: TransitInput, query?: Query<Entity>, task?: boolean }) => Promise<Entity>
  register: (request: { input: RegisterInput, task?: boolean }) => Promise<RegisterOutput>
  describe: (request: { input: DescribeInput, task?: boolean }) => Promise<DescribeOutput | RemoteError<"UNKNOWN_CLIENT">>
  assign: (request: { input?: null, query?: Query<Entity>, task?: boolean }) => Promise<Entity>
  ensure: (request: { input?: null, query?: Query<Entity>, task?: boolean }) => Promise<Entity>
  enumerate: (request: { input?: null, query?: Query<Entity>, task?: boolean }) => Promise<Entity[]>
  observe: (request: { input?: null, query?: Query<Entity>, task?: boolean }) => Promise<Entity | null>
  stream: (request: { input?: null, query?: Query<Entity>, task?: boolean }) => Promise<Readable>
  terminate: (request: { input?: null, query?: Query<Entity>, task?: boolean }) => Promise<Entity>
}

export interface Configuration {
  /** Origins whose Client ID Metadata Documents may be read; none are without one */
  trust?: string[]
  /** Seconds a Client ID Metadata Document is held before it is read again */
  lifetime?: number
  /** Seconds a registration nothing has used is kept */
  ttl?: number
  /** Bytes of a Client ID Metadata Document that are read */
  size?: number
  /** Milliseconds a Client ID Metadata Document has to arrive */
  timeout?: number
}
