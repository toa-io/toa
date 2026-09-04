// Written by `toa types`. Every run rewrites it.
// What a manifest does not state belongs in a file of your own.

import type { Query } from '@toa.io/core'

export interface Entity {
  id: string
  _version?: number
  _created?: number
  _updated?: number
  _deleted?: number | null
}

export interface Component {
  assign: (request: { input?: null, query?: Query<Entity>, task?: boolean }) => Promise<unknown>
  ensure: (request: { input?: null, query?: Query<Entity>, task?: boolean }) => Promise<unknown>
  enumerate: (request: { input?: null, query?: Query<Entity>, task?: boolean }) => Promise<unknown>
  observe: (request: { input?: null, query?: Query<Entity>, task?: boolean }) => Promise<unknown | null>
  stream: (request: { input?: null, query?: Query<Entity>, task?: boolean }) => Promise<unknown>
  terminate: (request: { input?: null, query?: Query<Entity>, task?: boolean }) => Promise<unknown>
}
