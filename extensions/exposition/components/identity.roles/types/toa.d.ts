// Written by `toa types`. Every run rewrites it.
// What a manifest does not state belongs in a file of your own.

import type { Query, RemoteError } from '@toa.io/core'
import type { Readable } from 'node:stream'

export interface Entity {
  grantor?: string
  identity: string
  role: string
  id: string
  _version?: number
  _created?: number
  _updated?: number
  _deleted?: number | null
}

export type GrantInput = {
  grantor?: {
    id?: string
    roles?: string[]
  }
  identity: string
  role: string
}

export type ListOutput = string[]

export type PrincipalInput = {
  id?: string
}

export interface Component {
  grant: (request: { input: GrantInput, task?: boolean }) => Promise<unknown | RemoteError<"INACCESSIBLE_SCOPE">>
  list: (request: { input?: null, query?: Query<Entity>, task?: boolean }) => Promise<ListOutput>
  principal: (request: { input: PrincipalInput, task?: boolean }) => Promise<unknown>
  assign: (request: { input?: null, query?: Query<Entity>, task?: boolean }) => Promise<Entity>
  ensure: (request: { input?: null, query?: Query<Entity>, task?: boolean }) => Promise<Entity>
  enumerate: (request: { input?: null, query?: Query<Entity>, task?: boolean }) => Promise<Entity[]>
  observe: (request: { input?: null, query?: Query<Entity>, task?: boolean }) => Promise<Entity | null>
  stream: (request: { input?: null, query?: Query<Entity>, task?: boolean }) => Promise<Readable>
  terminate: (request: { input?: null, query?: Query<Entity>, task?: boolean }) => Promise<Entity>
}
