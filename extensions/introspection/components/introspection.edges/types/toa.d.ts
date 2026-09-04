// Written by `toa types`. Every run rewrites it.
// What a manifest does not state belongs in a file of your own.

import type { Query } from '@toa.io/core'
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
  _version?: number
  _created?: number
  _updated?: number
  _deleted?: number | null
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
  merge: (request: { input: MergeInput, query?: Query<Entity>, task?: boolean }) => Promise<unknown>
  assign: (request: { input?: null, query?: Query<Entity>, task?: boolean }) => Promise<Entity>
  ensure: (request: { input?: null, query?: Query<Entity>, task?: boolean }) => Promise<Entity>
  enumerate: (request: { input?: null, query?: Query<Entity>, task?: boolean }) => Promise<Entity[]>
  observe: (request: { input?: null, query?: Query<Entity>, task?: boolean }) => Promise<Entity | null>
  stream: (request: { input?: null, query?: Query<Entity>, task?: boolean }) => Promise<Readable>
  terminate: (request: { input?: null, query?: Query<Entity>, task?: boolean }) => Promise<Entity>
}
