// Written by `toa types`. Every run rewrites it.
// What a manifest does not state belongs in a file of your own.

import type { Query } from '@toa.io/core'
import type { Readable } from 'node:stream'

export interface Entity {
  src?: unknown
  dst?: unknown
  sample?: unknown
  id: string
  _version?: number
  _created?: number
  _updated?: number
  _deleted?: number | null
}

export type MergeInput = {
  edges: Record<string, unknown>
}

export interface Component {
  merge: (request: { input: MergeInput, query?: Query<Entity>, task?: boolean }) => Promise<unknown>
  assign: (request: { input?: null, query?: Query<Entity>, task?: boolean }) => Promise<void>
  ensure: (request: { input?: null, query?: Query<Entity>, task?: boolean }) => Promise<Entity>
  enumerate: (request: { input?: null, query?: Query<Entity>, task?: boolean }) => Promise<Entity[]>
  observe: (request: { input?: null, query?: Query<Entity>, task?: boolean }) => Promise<Entity | null>
  stream: (request: { input?: null, query?: Query<Entity>, task?: boolean }) => Promise<Readable>
  terminate: (request: { input?: null, query?: Query<Entity>, task?: boolean }) => Promise<void>
}
