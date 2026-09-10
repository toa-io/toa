// Written by `toa types`. Every run rewrites it.
// What a manifest does not state belongs in a file of your own.

import type { Query } from '@toa.io/core/types'
import type { Readable } from 'node:stream'

export interface Entity {
  /** What the processes are being told to do */
  type: "halt"
  /** How long every process stays disconnected before it builds itself again */
  seconds: number
  id: string
  VERSION: number
  CREATED: number
  UPDATED: number
  DELETED: number | null
  REGION: number
}

export type CreateInput = {
  /** What the processes are being told to do */
  type: "halt"
  /** How long every process stays disconnected before it builds itself again */
  seconds: number
}

export type TransitInput = {
  /** What the processes are being told to do */
  type?: "halt"
  /** How long every process stays disconnected before it builds itself again */
  seconds?: number
}

export interface Component {
  /** Tell every process of this deployment to do something. */
  create: (request: { input: CreateInput, task?: boolean }) => Promise<unknown>
  transit: (request: { input: TransitInput, query?: Query<Entity>, task?: boolean }) => Promise<Entity>
  assign: (request: { input?: null, query?: Query<Entity>, task?: boolean }) => Promise<Entity>
  ensure: (request: { input?: null, query?: Query<Entity>, task?: boolean }) => Promise<Entity>
  enumerate: (request: { input?: null, query?: Query<Entity>, task?: boolean }) => Promise<Entity[]>
  observe: (request: { input?: null, query?: Query<Entity>, task?: boolean }) => Promise<Entity | null>
  stream: (request: { input?: null, query?: Query<Entity>, task?: boolean }) => Promise<Readable>
  terminate: (request: { input?: null, query?: Query<Entity>, task?: boolean }) => Promise<Entity>
}
