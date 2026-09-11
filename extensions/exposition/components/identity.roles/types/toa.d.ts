// Written by `toa types`. Every run rewrites it.
// What a manifest does not state belongs in a file of your own.

import type { Options, Query, RemoteError } from '@toa.io/core/types'
import type { Readable } from 'node:stream'

export interface Entity {
  grantor?: string
  identity: string
  role: string
  id: string
  VERSION: number
  CREATED: number
  UPDATED: number
  DELETED: number | null
  REGION: number
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
  grant: (request: { input: GrantInput, task?: boolean }, options?: Options) => Promise<unknown | RemoteError<"INACCESSIBLE_SCOPE">>
  list: (request: { input?: null, query?: Query<Entity>, task?: boolean }, options?: Options) => Promise<ListOutput>
  principal: (request: { input: PrincipalInput, task?: boolean }, options?: Options) => Promise<unknown>
  assign: (request: { input?: null, query?: Query<Entity>, task?: boolean }, options?: Options) => Promise<Entity>
  ensure: (request: { input?: null, query?: Query<Entity>, task?: boolean }, options?: Options) => Promise<Entity>
  enumerate: (request: { input?: null, query?: Query<Entity>, task?: boolean }, options?: Options) => Promise<Entity[]>
  observe: (request: { input?: null, query?: Query<Entity>, task?: boolean }, options?: Options) => Promise<Entity | null>
  stream: (request: { input?: null, query?: Query<Entity>, task?: boolean }, options?: Options) => Promise<Readable>
  terminate: (request: { input?: null, query?: Query<Entity>, task?: boolean }, options?: Options) => Promise<Entity>
}
