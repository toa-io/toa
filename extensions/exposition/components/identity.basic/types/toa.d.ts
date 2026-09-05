// Written by `toa types`. Every run rewrites it.
// What a manifest does not state belongs in a file of your own.

import type { Query, RemoteError } from '@toa.io/core/types'
import type { Secret } from '@toa.io/extensions.configuration'
import type { FetchInit } from '@toa.io/extensions.fetch'
import type { Logs, Span } from '@toa.io/extensions.telemetry'
import type { Readable } from 'node:stream'

export interface Entity {
  authority: string
  username: string
  password: string
  id: string
  _version?: number
  _created?: number
  _updated?: number
  _deleted?: number | null
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
  transit: (request: { input: TransitInput, query?: Query<Entity>, task?: boolean }) => Promise<TransitOutput | RemoteError<"PRINCIPAL_LOCKED" | "INVALID_USERNAME" | "INVALID_PASSWORD" | "EXISTS">>
  create: (request: { input: CreateInput, task?: boolean }) => Promise<CreateOutput | RemoteError<"PRINCIPAL_LOCKED" | "INVALID_USERNAME" | "INVALID_PASSWORD" | "EXISTS">>
  add: (request: { input: AddInput, task?: boolean }) => Promise<unknown | RemoteError<"PRINCIPAL_LOCKED" | "INVALID_USERNAME" | "INVALID_PASSWORD" | "EXISTS">>
  incept: (request: { input: InceptInput, task?: boolean }) => Promise<InceptOutput | RemoteError<"INVALID_CREDENTIALS">>
  authenticate: (request: { input: AuthenticateInput, task?: boolean }) => Promise<AuthenticateOutput | RemoteError<"NOT_FOUND" | "PASSWORD_MISMATCH">>
  check: (request: { input: CheckInput, task?: boolean }) => Promise<CheckOutput>
  info: (request: { input: InfoInput, task?: boolean }) => Promise<InfoOutput>
  delete: (request: { input: DeleteInput, task?: boolean }) => Promise<unknown>
  assign: (request: { input?: null, query?: Query<Entity>, task?: boolean }) => Promise<Entity>
  ensure: (request: { input?: null, query?: Query<Entity>, task?: boolean }) => Promise<Entity>
  enumerate: (request: { input?: null, query?: Query<Entity>, task?: boolean }) => Promise<Entity[]>
  observe: (request: { input?: null, query?: Query<Entity>, task?: boolean }) => Promise<Entity | null>
  stream: (request: { input?: null, query?: Query<Entity>, task?: boolean }) => Promise<Readable>
  terminate: (request: { input?: null, query?: Query<Entity>, task?: boolean }) => Promise<Entity>
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
