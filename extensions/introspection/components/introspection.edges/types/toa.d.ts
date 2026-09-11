// Written by `toa types`. Every run rewrites it.
// What a manifest does not state belongs in a file of your own.

import type { Options, Query } from '@toa.io/core/types'
import type { Readable } from 'node:stream'

export interface Entity {
  /** What caused the call — another operation, an event, or a service */
  src: {
    namespace?: string
    component?: string
    operation?: string
    event?: string
    service?: string
  }
  /** What was called */
  dst: {
    namespace: string
    component: string
    operation: string
  }
  /** The last call observed on this edge */
  sample?: {
    at: number
    input?: unknown
    outcome: string
  }
  id: string
  VERSION: number
  CREATED: number
  UPDATED: number
  DELETED: number | null
  REGION: number
}

export type MergeInput = {
  /** What each replica observed since its last flush, by edge id */
  edges: Record<string, {
    /** What caused the call — another operation, an event, or a service */
    src: {
      namespace?: string
      component?: string
      operation?: string
      event?: string
      service?: string
    }
    /** What was called */
    dst: {
      namespace: string
      component: string
      operation: string
    }
    /** The last call observed on this edge */
    sample?: {
      at: number
      input?: unknown
      outcome: string
    }
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
