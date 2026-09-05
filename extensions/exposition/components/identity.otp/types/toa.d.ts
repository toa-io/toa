// Written by `toa types`. Every run rewrites it.
// What a manifest does not state belongs in a file of your own.

import type { Query, RemoteError } from '@toa.io/core/types'
import type { FetchInit } from '@toa.io/extensions.fetch'
import type { Stash } from '@toa.io/extensions.stash'
import type { Logs, Span } from '@toa.io/extensions.telemetry'
import type { Readable } from 'node:stream'

export interface Entity {
  authority: string
  username: string
  identity?: string
  id: string
  _version?: number
  _created?: number
  _updated?: number
  _deleted?: number | null
}

export type IssueInput = {
  authority: string
  username: string
  identity?: string
  /** OTP expiration time in seconds */
  lifetime?: number
}

export type AuthenticateInput = {
  authority: string
  credentials: string
}

export type AuthenticateOutput = {
  identity?: {
    id?: string
  }
}

export interface Component {
  issue: (request: { input: IssueInput, task?: boolean }) => Promise<unknown>
  authenticate: (request: { input: AuthenticateInput, task?: boolean }) => Promise<AuthenticateOutput | RemoteError<"INVALID_CREDENTIALS" | "EXPIRED" | "TOO_MANY_ATTEMPTS" | "NOT_FOUND">>
  assign: (request: { input?: null, query?: Query<Entity>, task?: boolean }) => Promise<Entity>
  ensure: (request: { input?: null, query?: Query<Entity>, task?: boolean }) => Promise<Entity>
  enumerate: (request: { input?: null, query?: Query<Entity>, task?: boolean }) => Promise<Entity[]>
  observe: (request: { input?: null, query?: Query<Entity>, task?: boolean }) => Promise<Entity | null>
  stream: (request: { input?: null, query?: Query<Entity>, task?: boolean }) => Promise<Readable>
  terminate: (request: { input?: null, query?: Query<Entity>, task?: boolean }) => Promise<Entity>
}

export interface Configuration {
  /** OTP expiration time in seconds */
  lifetime?: number
  /** Failed authentication attempts allowed per username within `lifetime` */
  attempts?: number
}
