// Written by `toa types`. Every run rewrites it.
// What a manifest does not state belongs in a file of your own.

import type { Options, Query } from '@toa.io/core/types'
import type { Readable } from 'node:stream'

export interface Entity {
  identity: string
  key: string
  label: string
  expires?: number
  revokedAt?: number
  id: string
  VERSION: number
  CREATED: number
  UPDATED: number
  DELETED: number | null
  REGION: number
}

export type CreateInput = {
  identity: string
  label: string
  expires?: number
}

export type CreateOutput = {
  id: string
  key: string
}

export type RevokeInput = {
  identity: string
}

export type RevokeOutput = null

export interface Component {
  create: (request: { input: CreateInput, task?: boolean }, options?: Options) => Promise<CreateOutput>
  revoke: (request: { input: RevokeInput, task?: boolean }, options?: Options) => Promise<RevokeOutput>
  disable: (request: { input?: null, query?: Query<Entity>, task?: boolean }, options?: Options) => Promise<unknown>
  assign: (request: { input?: null, query?: Query<Entity>, task?: boolean }, options?: Options) => Promise<Entity>
  ensure: (request: { input?: null, query?: Query<Entity>, task?: boolean }, options?: Options) => Promise<Entity>
  enumerate: (request: { input?: null, query?: Query<Entity>, task?: boolean }, options?: Options) => Promise<Entity[]>
  observe: (request: { input?: null, query?: Query<Entity>, task?: boolean }, options?: Options) => Promise<Entity | null>
  stream: (request: { input?: null, query?: Query<Entity>, task?: boolean }, options?: Options) => Promise<Readable>
  terminate: (request: { input?: null, query?: Query<Entity>, task?: boolean }, options?: Options) => Promise<Entity>
}
