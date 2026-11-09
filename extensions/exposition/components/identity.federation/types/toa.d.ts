// Written by `toa types`. Every run rewrites it.
// What a manifest does not state belongs in a file of your own.

import type { CodedError, Query } from '@toa.io/core/types'
import type { Secret } from '@toa.io/extensions.configuration'
import type { FetchInit } from '@toa.io/extensions.fetch'
import type { Logs, Metrics, Span } from '@toa.io/extensions.telemetry'
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
  VERSION: number
  CREATED: number
  UPDATED: number
  DELETED: number | null
  REGION: number
}

export type State = Entity & { DISCARD: boolean, TRAILERS: Record<string, unknown> }

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

export type IssueInput = {
  authority: string
  /** Who presents the token */
  sub: string
  /** Whom the token is presented to */
  audience: string
  /** Seconds the token is valid for */
  lifetime?: number
  /** Carried in the token as `nonce`, as given */
  nonce?: string
}

export type IssueOutput = {
  token: string
  /** When the token expires, in seconds */
  exp: number
}

export type KeysOutput = {
  keys: Array<Record<string, unknown>>
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
  create: (request: { input: CreateInput, entity?: Partial<Entity>, task?: boolean }) => Promise<{} | null | undefined | CodedError<"EXISTS" | "TOKEN" | "TRUST" | "RESPONSE" | "CONFIG" | "NO_TOKEN" | "ISS" | "SUB" | "EXP" | "REPLAY" | "CODE_NOT_ENABLED" | "CODE_SCHEMA">>
  incept: (request: { input: InceptInput, entity?: Partial<Entity>, task?: boolean }) => Promise<InceptOutput | CodedError<"EXISTS" | "TOKEN" | "TRUST" | "RESPONSE" | "CONFIG" | "NO_TOKEN" | "ISS" | "SUB" | "EXP" | "REPLAY" | "CODE_NOT_ENABLED" | "CODE_SCHEMA">>
  authenticate: (request: { input: AuthenticateInput, entity?: Partial<Entity>, task?: boolean }) => Promise<AuthenticateOutput | CodedError<"NOT_FOUND" | "TOKEN" | "TRUST" | "RESPONSE" | "CONFIG" | "NO_TOKEN" | "ISS" | "SUB" | "EXP" | "REPLAY" | "CODE_NOT_ENABLED" | "CODE_SCHEMA">>
  decode: (request: { input: DecodeInput, entity?: Partial<Entity>, task?: boolean }) => Promise<DecodeOutput>
  issue: (request: { input: IssueInput, task?: boolean }) => Promise<IssueOutput | CodedError<"NOT_ISSUER" | "LIFETIME">>
  keys: (request: { input?: null, task?: boolean }) => Promise<KeysOutput>
  list: (request: { input: ListInput, task?: boolean }) => Promise<unknown>
  delete: (request: { input: DeleteInput, entity?: Partial<Entity>, task?: boolean }) => Promise<unknown>
  assign: (request: { input?: null, query?: Query<Entity>, task?: boolean }) => Promise<Entity>
  ensure: (request: { input?: null, query?: Query<Entity>, entity?: Partial<Entity>, task?: boolean }) => Promise<Entity>
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
  /** The first signs the tokens this context issues; every one is published */
  keys?: Array<{
    kid: string
    /** ES256 private key, PKCS8 in PEM form */
    key: Secret
  }>
  /** The longest a token this context issues may be valid, in seconds */
  lifetime?: number
  /** Subject that will be assigned the `system` Role */
  principal?: {
    authority: string
    iss: string
    sub: string
  }
  assert?: boolean
}
