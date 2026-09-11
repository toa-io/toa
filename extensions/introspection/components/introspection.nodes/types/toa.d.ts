// Written by `toa types`. Every run rewrites it.
// What a manifest does not state belongs in a file of your own.

import type { Options, Query } from '@toa.io/core/types'
import type { Readable } from 'node:stream'

export interface Entity {
  version?: string
  entity?: unknown
  operations?: unknown
  events?: unknown
  receivers?: unknown
  extensions?: unknown
  namespace: string
  component: string
  id: string
  VERSION: number
  CREATED: number
  UPDATED: number
  DELETED: number | null
  REGION: number
}

export type MergeInput = {
  /** What each announced component describes of itself, by its id */
  nodes: Record<string, {
    version?: string
    entity?: unknown
    operations?: unknown
    events?: unknown
    receivers?: unknown
    extensions?: unknown
    namespace: string
    component: string
  }>
}

export interface Component {
  merge: (request: { input: MergeInput, query?: Query<Entity>, task?: boolean }, options?: Options) => Promise<unknown>
  assign: (request: { input?: null, query?: Query<Entity>, task?: boolean }, options?: Options) => Promise<Entity>
  ensure: (request: { input?: null, query?: Query<Entity>, task?: boolean }, options?: Options) => Promise<Entity>
  enumerate: (request: { input?: null, query?: Query<Entity>, task?: boolean }, options?: Options) => Promise<Entity[]>
  observe: (request: { input?: null, query?: Query<Entity>, task?: boolean }, options?: Options) => Promise<Entity | null>
  stream: (request: { input?: null, query?: Query<Entity>, task?: boolean }, options?: Options) => Promise<Readable>
  terminate: (request: { input?: null, query?: Query<Entity>, task?: boolean }, options?: Options) => Promise<Entity>
}
