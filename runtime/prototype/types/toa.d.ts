// Written by `toa types`. Every run rewrites it.
// What a manifest does not state belongs in a file of your own.

import type { Query } from '@toa.io/core/types'

export interface Entity {
  id: string
  VERSION?: number
  CREATED?: number
  UPDATED?: number
  DELETED?: number | null
}

export interface Component {
  assign: (request: { input?: null, query?: Query<Entity>, task?: boolean }) => Promise<unknown>
  ensure: (request: { input?: null, query?: Query<Entity>, task?: boolean }) => Promise<unknown>
  enumerate: (request: { input?: null, query?: Query<Entity>, task?: boolean }) => Promise<unknown>
  observe: (request: { input?: null, query?: Query<Entity>, task?: boolean }) => Promise<unknown | null>
  stream: (request: { input?: null, query?: Query<Entity>, task?: boolean }) => Promise<unknown>
  terminate: (request: { input?: null, query?: Query<Entity>, task?: boolean }) => Promise<unknown>
}
