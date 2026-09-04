// Written by `toa types`. Every run rewrites it.
// What a manifest does not state belongs in a file of your own.

import type { Query, RemoteError } from '@toa.io/core'
import type { FetchInit } from '@toa.io/extensions.fetch'
import type { Logs, Span } from '@toa.io/extensions.telemetry'
import type { Readable } from 'node:stream'

export interface Entity {
  revokedAt?: number
  id: string
  _version?: number
  _created?: number
  _updated?: number
  _deleted?: number | null
}

export type EncryptInput = {
  lifetime?: number
  scopes?: string[]
  permissions?: Record<string, string[]>
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
  label: string
}

export type IssueOutput = {
  kid: string
  exp?: number
  token: string
}

export interface Component {
  encrypt: (request: { input: EncryptInput, task?: boolean }) => Promise<EncryptOutput | RemoteError<"INACCESSIBLE_SCOPE">>
  decrypt: (request: { input: DecryptInput, task?: boolean }) => Promise<DecryptOutput | RemoteError<"INVALID_TOKEN" | "INVALID_KEY" | "FORGED_KEY" | "REVOKED_KEY">>
  authenticate: (request: { input: AuthenticateInput, task?: boolean }) => Promise<AuthenticateOutput | RemoteError<"UNRECOGNIZED" | "AUTHORITY_MISMATCH" | "TOKEN_REVOKED" | "INVALID_TOKEN" | "INVALID_KEY" | "FORGED_KEY" | "REVOKED_KEY">>
  issue: (request: { input: IssueInput, task?: boolean }) => Promise<IssueOutput | RemoteError<"INACCESSIBLE_SCOPE">>
  revoke: (request: { input?: null, query?: Query<Entity>, task?: boolean }) => Promise<unknown>
  assign: (request: { input?: null, query?: Query<Entity>, task?: boolean }) => Promise<void>
  ensure: (request: { input?: null, query?: Query<Entity>, task?: boolean }) => Promise<Entity>
  enumerate: (request: { input?: null, query?: Query<Entity>, task?: boolean }) => Promise<Entity[]>
  observe: (request: { input?: null, query?: Query<Entity>, task?: boolean }) => Promise<Entity | null>
  stream: (request: { input?: null, query?: Query<Entity>, task?: boolean }) => Promise<Readable>
  terminate: (request: { input?: null, query?: Query<Entity>, task?: boolean }) => Promise<void>
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
