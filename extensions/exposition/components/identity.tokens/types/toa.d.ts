// Written by `toa types`. Every run rewrites it.
// What a manifest does not state belongs in a file of your own.

import type { Options, Query, RemoteError } from '@toa.io/core/types'
import type { Secret } from '@toa.io/extensions.configuration'
import type { FetchInit } from '@toa.io/extensions.fetch'
import type { Logs, Metrics, Span } from '@toa.io/extensions.telemetry'
import type { Readable } from 'node:stream'

export interface Entity {
  revokedAt?: number
  id: string
  VERSION: number
  CREATED: number
  UPDATED: number
  DELETED: number | null
  REGION: number
}

export type EncryptInput = {
  lifetime?: number
  scopes?: string[]
  permissions?: Record<string, string[]>
  /** Resource URIs this token may be presented at (RFC 8707) */
  audience?: string[]
  key?: {
    id: string
    key: string
  }
  authority: string
  identity: {
    id: string
    roles: string[]
    [key: string]: unknown
  }
}

export type EncryptOutput = string

export type DecryptInput = string

export type DecryptOutput = {
  /** The authority the token names as its issuer */
  iss: string
  identity: {
    id: string
    roles: string[]
    [key: string]: unknown
  }
  iat: string
  exp?: string
  /** Resource URIs this token may be presented at */
  aud?: string | unknown[]
  custom: boolean
  refresh: boolean
}

export type AuthenticateInput = {
  authority: string
  credentials: string
}

export type AuthenticateOutput = {
  identity: {
    id: string
    roles: string[]
    [key: string]: unknown
  }
  refresh: boolean
}

export type IssueInput = {
  authority: string
  identity: string
  lifetime?: number
  scopes?: string[]
  permissions?: Record<string, string[]>
  /** Resource URIs this token may be presented at (RFC 8707) */
  audience?: string[]
  label: string
}

export type IssueOutput = {
  kid: string
  exp?: number
  token: string
}

export type RevokeOutput = null

export interface Component {
  encrypt: (request: { input: EncryptInput, task?: boolean }, options?: Options) => Promise<EncryptOutput | RemoteError<"INACCESSIBLE_SCOPE">>
  decrypt: (request: { input: DecryptInput, task?: boolean }, options?: Options) => Promise<DecryptOutput | RemoteError<"INVALID_TOKEN" | "INVALID_KEY" | "FORGED_KEY" | "REVOKED_KEY">>
  authenticate: (request: { input: AuthenticateInput, task?: boolean }, options?: Options) => Promise<AuthenticateOutput | RemoteError<"UNRECOGNIZED" | "AUTHORITY_MISMATCH" | "TOKEN_REVOKED" | "INVALID_TOKEN" | "INVALID_KEY" | "FORGED_KEY" | "REVOKED_KEY">>
  issue: (request: { input: IssueInput, task?: boolean }, options?: Options) => Promise<IssueOutput | RemoteError<"INACCESSIBLE_SCOPE">>
  revoke: (request: { input?: null, query?: Query<Entity>, task?: boolean }, options?: Options) => Promise<RevokeOutput>
  assign: (request: { input?: null, query?: Query<Entity>, task?: boolean }, options?: Options) => Promise<Entity>
  ensure: (request: { input?: null, query?: Query<Entity>, task?: boolean }, options?: Options) => Promise<Entity>
  enumerate: (request: { input?: null, query?: Query<Entity>, task?: boolean }, options?: Options) => Promise<Entity[]>
  observe: (request: { input?: null, query?: Query<Entity>, task?: boolean }, options?: Options) => Promise<Entity | null>
  stream: (request: { input?: null, query?: Query<Entity>, task?: boolean }, options?: Options) => Promise<Readable>
  terminate: (request: { input?: null, query?: Query<Entity>, task?: boolean }, options?: Options) => Promise<Entity>
}

export interface Configuration {
  keys: Array<{
    id: string
    key: Secret
    format?: "jwe" | "paseto"
  }>
  /** Token expiration time in seconds (default 30 days) */
  lifetime: number
  /** Token refresh time in seconds (default 10 minutes) */
  refresh: number
  /** Custom token keys LRU cache configuration */
  cache: {
    max: number
    ttl: number
  }
}
