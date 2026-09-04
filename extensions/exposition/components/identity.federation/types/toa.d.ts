// Written by `toa types`. Every run rewrites it.
// What a manifest does not state belongs in a file of your own.

import type { Query, RemoteError } from '@toa.io/core'
import type { FetchInit } from '@toa.io/extensions.fetch'
import type { Logs, Span } from '@toa.io/extensions.telemetry'
import type { Readable } from 'node:stream'

export interface Entity {
  /** The authority token is valid for */
  authority: string
  /** The issuer, or signer, of the token, URI like `https://accounts.google.com` */
  iss: string
  /** The ID that represents the principal making the request */
  sub: string
  /** Identity associated with these credentials */
  identity: string
  id: string
  _version?: number
  _created?: number
  _updated?: number
  _deleted?: number | null
}

export type TransitInput = {
  authority: string
  iss: string
  sub: string
  identity: string
}

export type CreateInput = {
  scheme: "bearer" | "code"
  authority: string
  credentials: string
  id: string
}

export type InceptInput = {
  scheme: "bearer" | "code"
  authority: string
  credentials: string
  id: string
}

export type InceptOutput = {
  id?: string
}

export type AuthenticateInput = {
  scheme: "bearer" | "code"
  authority: string
  credentials: string
}

export type AuthenticateOutput = {
  identity?: {
    id: string
    claims: {
      iss: string
      aud?: string
      sub: string
      [key: string]: unknown
    }
  }
}

export type DecodeInput = string

export type DecodeOutput = {
  iss: string
  aud?: string
  sub: string
  [key: string]: unknown
}

export type ListInput = {
  authority: string
  identity: string
}

export type DeleteInput = {
  authority: string
  identity: string
  credential: string
}

export interface Component {
  transit: (request: { input: TransitInput, query?: Query<Entity>, task?: boolean }) => Promise<Entity>
  create: (request: { input: CreateInput, task?: boolean }) => Promise<unknown | RemoteError<"EXISTS" | "TOKEN" | "TRUST" | "RESPONSE" | "CONFIG" | "NO_TOKEN" | "ISS" | "SUB" | "EXP" | "REPLAY" | "CODE_NOT_ENABLED" | "CODE_SCHEMA">>
  incept: (request: { input: InceptInput, task?: boolean }) => Promise<InceptOutput | RemoteError<"EXISTS" | "TOKEN" | "TRUST" | "RESPONSE" | "CONFIG" | "NO_TOKEN" | "ISS" | "SUB" | "EXP" | "REPLAY" | "CODE_NOT_ENABLED" | "CODE_SCHEMA">>
  authenticate: (request: { input: AuthenticateInput, task?: boolean }) => Promise<AuthenticateOutput | RemoteError<"NOT_FOUND" | "TOKEN" | "TRUST" | "RESPONSE" | "CONFIG" | "NO_TOKEN" | "ISS" | "SUB" | "EXP" | "REPLAY" | "CODE_NOT_ENABLED" | "CODE_SCHEMA">>
  decode: (request: { input: DecodeInput, task?: boolean }) => Promise<DecodeOutput>
  list: (request: { input: ListInput, task?: boolean }) => Promise<unknown>
  delete: (request: { input: DeleteInput, task?: boolean }) => Promise<unknown>
  assign: (request: { input?: null, query?: Query<Entity>, task?: boolean }) => Promise<Entity>
  ensure: (request: { input?: null, query?: Query<Entity>, task?: boolean }) => Promise<Entity>
  enumerate: (request: { input?: null, query?: Query<Entity>, task?: boolean }) => Promise<Entity[]>
  observe: (request: { input?: null, query?: Query<Entity>, task?: boolean }) => Promise<Entity | null>
  stream: (request: { input?: null, query?: Query<Entity>, task?: boolean }) => Promise<Readable>
  terminate: (request: { input?: null, query?: Query<Entity>, task?: boolean }) => Promise<Entity>
}

export interface Configuration {
  trust?: Array<{
    /** Allowed values for a token `iss` field */
    iss: string
    /** Acceptable `aud` value(s) */
    aud: string | string[]
    signature?: {
      iss: string
      kid: string
      /** PKCS8 private key in PEM form */
      key: string
    }
    /** Client secret for the Identity Provider. Required for Authorization Code Flow. */
    secret?: string
  }>
  /** Subject that will be assigned the `system` Role */
  principal?: {
    authority: string
    iss: string
    sub: string
  }
  assert?: boolean
}
