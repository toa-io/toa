// Written by `toa types`. Every run rewrites it.
// What a manifest does not state belongs in a file of your own.

import type { Query } from '@toa.io/core/types'
import type { Readable } from 'node:stream'

export interface Entity {
  /** The identity of the task or the event the step was made for */
  run?: string
  /** What the step answered, encoded by the extension */
  answer?: Record<string, unknown>
  /** When the run can no longer be picked up. Every step of a run carries the moment its first step fixed, so a run is reaped whole. */
  expires?: number
  id: string
  VERSION: number
  CREATED: number
  UPDATED: number
  DELETED: number | null
  REGION: number
}

export type State = Entity & { DISCARD: boolean, TRAILERS: Record<string, unknown> }

export type RecordInput = {
  run: string
  answer: Record<string, unknown>
  expires: number
}

export type RecordOutput = Record<string, unknown>

export interface Component {
  record: (request: { input: RecordInput, query?: Query<Entity>, task?: boolean }) => Promise<RecordOutput>
  recall: (request: { input?: null, query: Query<Entity>, task?: boolean }) => Promise<unknown>
  assign: (request: { input?: null, query?: Query<Entity>, task?: boolean }) => Promise<Entity>
  ensure: (request: { input?: null, query?: Query<Entity>, task?: boolean }) => Promise<Entity>
  enumerate: (request: { input?: null, query?: Query<Entity>, task?: boolean }) => Promise<Entity[]>
  observe: (request: { input?: null, query?: Query<Entity>, task?: boolean }) => Promise<Entity | null>
  stream: (request: { input?: null, query?: Query<Entity>, task?: boolean }) => Promise<Readable>
  terminate: (request: { input?: null, query?: Query<Entity>, task?: boolean }) => Promise<Entity>
}
