// Written by `toa types`. Every run rewrites it.
// What a manifest does not state belongs in a file of your own.

import type { Options, Query, RemoteError } from '@toa.io/core/types'
import type { Secret } from '@toa.io/extensions.configuration'
import type { FetchInit } from '@toa.io/extensions.fetch'
import type { Logs, Metrics, Span } from '@toa.io/extensions.telemetry'
import type { Readable } from 'node:stream'

export interface Entity {
  authority: string
  username: string
  password: string
  id: string
  VERSION: number
  CREATED: number
  UPDATED: number
  DELETED: number | null
  REGION: number
}

export type TransitInput = {
  username?: string
  password?: string
  authority?: string
  /** Whether the credentials are being created rather than changed */
  inception?: boolean
}

export type TransitOutput = {
  id: string
}

export type CreateInput = {
  authority: string
  username: string
  password: string
  /** Whether the credentials are being created rather than changed */
  inception?: boolean
}

export type CreateOutput = {
  id: string
}

export type AddInput = {
  id: string
  authority: string
  username: string
  password: string
}

export type InceptInput = {
  authority: string
  id: string
  credentials: string
}

export type InceptOutput = {
  id?: string
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

export type CheckInput = {
  username: string
}

export type CheckOutput = null

export type InfoInput = {
  authority: string
  identity: string
}

export type InfoOutput = {
  username: string
} | null

export type DeleteInput = {
  authority: string
  identity: string
}

export interface Component {
  transit: (request: { input: TransitInput, query?: Query<Entity>, task?: boolean }, options?: Options) => Promise<TransitOutput | RemoteError<"PRINCIPAL_LOCKED" | "INVALID_USERNAME" | "INVALID_PASSWORD" | "EXISTS">>
  create: (request: { input: CreateInput, task?: boolean }, options?: Options) => Promise<CreateOutput | RemoteError<"PRINCIPAL_LOCKED" | "INVALID_USERNAME" | "INVALID_PASSWORD" | "EXISTS">>
  add: (request: { input: AddInput, task?: boolean }, options?: Options) => Promise<unknown | RemoteError<"PRINCIPAL_LOCKED" | "INVALID_USERNAME" | "INVALID_PASSWORD" | "EXISTS">>
  incept: (request: { input: InceptInput, task?: boolean }, options?: Options) => Promise<InceptOutput | RemoteError<"INVALID_CREDENTIALS">>
  authenticate: (request: { input: AuthenticateInput, task?: boolean }, options?: Options) => Promise<AuthenticateOutput | RemoteError<"NOT_FOUND" | "PASSWORD_MISMATCH">>
  check: (request: { input: CheckInput, task?: boolean }, options?: Options) => Promise<CheckOutput>
  info: (request: { input: InfoInput, task?: boolean }, options?: Options) => Promise<InfoOutput>
  delete: (request: { input: DeleteInput, task?: boolean }, options?: Options) => Promise<unknown>
  assign: (request: { input?: null, query?: Query<Entity>, task?: boolean }, options?: Options) => Promise<Entity>
  ensure: (request: { input?: null, query?: Query<Entity>, task?: boolean }, options?: Options) => Promise<Entity>
  enumerate: (request: { input?: null, query?: Query<Entity>, task?: boolean }, options?: Options) => Promise<Entity[]>
  observe: (request: { input?: null, query?: Query<Entity>, task?: boolean }, options?: Options) => Promise<Entity | null>
  stream: (request: { input?: null, query?: Query<Entity>, task?: boolean }, options?: Options) => Promise<Readable>
  terminate: (request: { input?: null, query?: Query<Entity>, task?: boolean }, options?: Options) => Promise<Entity>
}

export interface Configuration {
  rounds: number
  /** Hashing pepper, a secret */
  pepper?: Secret
  /** Basic credentials whose Identity is granted the `system` role */
  principal?: {
    authority: string
    username: string
  }
  username: string[]
  password: string[]
}
