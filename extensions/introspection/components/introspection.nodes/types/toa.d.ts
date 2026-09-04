// Written by `toa types`. Every run rewrites it.
// What a manifest does not state belongs in a file of your own.

import type { Query } from '@toa.io/core'
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
  _version?: number
  _created?: number
  _updated?: number
  _deleted?: number | null
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
  merge: (request: { input: MergeInput, query?: Query<Entity>, task?: boolean }) => Promise<unknown>
  assign: (request: { input?: null, query?: Query<Entity>, task?: boolean }) => Promise<Entity>
  ensure: (request: { input?: null, query?: Query<Entity>, task?: boolean }) => Promise<Entity>
  enumerate: (request: { input?: null, query?: Query<Entity>, task?: boolean }) => Promise<Entity[]>
  observe: (request: { input?: null, query?: Query<Entity>, task?: boolean }) => Promise<Entity | null>
  stream: (request: { input?: null, query?: Query<Entity>, task?: boolean }) => Promise<Readable>
  terminate: (request: { input?: null, query?: Query<Entity>, task?: boolean }) => Promise<Entity>
}
