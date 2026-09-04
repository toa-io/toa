// Written by `toa types`. Every run rewrites it.
// What a manifest does not state belongs in a file of your own.

import type { Query, RemoteError } from '@toa.io/core'
import type { Stash } from '@toa.io/extensions.stash'
import type { Readable } from 'node:stream'

export interface Entity {
  authority: string
  identity: string
  kid: string
  /** AAGUID */
  aid: string
  /** credentialBackedUp */
  synced: boolean
  /** Base64-encoded Uint8Array */
  key: string
  counter: number
  transports?: string[]
  label?: string
  id: string
  _version?: number
  _created: number
  _updated?: number
  _deleted?: number | null
}

export type ChallengeInput = {
  type: "creation" | "request"
  authority: string
  identity?: string
}

export type CreateInput = {
  authority: string
  origin: string
  identity: string
  label: string
  id: string
  type: string
  response: {
    id?: string
    response?: {
      attestationObject: string
      clientDataJSON: string
      transports: string[]
      publicKeyAlgorithm: number
      publicKey: string
      authenticatorData: string
    }
  }
  authenticatorAttachment?: string | null
  clientExtensionResults?: Record<string, unknown>
}

export type UseInput = {
  origin: string
  id: string
  type?: string
  response: {
    authenticatorData?: string
    clientDataJSON?: string
    signature?: string
    userHandle?: string
  }
  authenticatorAttachment?: string
  clientExtensionResults?: Record<string, unknown>
}

export type AuthenticateInput = {
  authority: string
  origin: string
  id: string
  type?: string
  response: {
    authenticatorData?: string
    clientDataJSON?: string
    signature?: string
    userHandle?: string
  }
  authenticatorAttachment?: string
  clientExtensionResults?: Record<string, unknown>
}

export type ListInput = {
  authority: string
  identity: string
}

export type DeleteInput = {
  authority: string
  identity: string
  id: string
}

export interface Component {
  challenge: (request: { input: ChallengeInput, task?: boolean }) => Promise<unknown>
  create: (request: { input: CreateInput, task?: boolean }) => Promise<unknown | RemoteError<"FAILED" | "INVALID">>
  use: (request: { input: UseInput, query: Query<Entity>, task?: boolean }) => Promise<unknown | RemoteError<"FAILED" | "INVALID">>
  authenticate: (request: { input: AuthenticateInput, task?: boolean }) => Promise<unknown | RemoteError<"MISS">>
  list: (request: { input: ListInput, task?: boolean }) => Promise<unknown>
  delete: (request: { input: DeleteInput, task?: boolean }) => Promise<unknown>
  assign: (request: { input?: null, query?: Query<Entity>, task?: boolean }) => Promise<void>
  ensure: (request: { input?: null, query?: Query<Entity>, task?: boolean }) => Promise<Entity>
  enumerate: (request: { input?: null, query?: Query<Entity>, task?: boolean }) => Promise<Entity[]>
  observe: (request: { input?: null, query?: Query<Entity>, task?: boolean }) => Promise<Entity | null>
  stream: (request: { input?: null, query?: Query<Entity>, task?: boolean }) => Promise<Readable>
  terminate: (request: { input?: null, query?: Query<Entity>, task?: boolean }) => Promise<void>
}

export interface Configuration {
  algorithms?: number[]
  timeout?: number
  /** AuthenticatorSelectionCriteria.userVerification */
  verification?: "required" | "preferred" | "discouraged"
  /** AuthenticatorSelectionCriteria.residentKey */
  residence?: "required" | "preferred" | "discouraged"
}
