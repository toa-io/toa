// Written by `toa types`. Every run rewrites it.
// What a manifest does not state belongs in a file of your own.

import type { Options, Query, RemoteError } from '@toa.io/core/types'
import type { Readable } from 'node:stream'

export interface Entity {
  component: string
  epoch: string
  configuration: Record<string, unknown>
  originator: string
  id: string
  VERSION: number
  CREATED: number
  UPDATED: number
  DELETED: number | null
  REGION: number
}

export type GetInput = {
  component: string
  epoch?: string
}

export type GetOutput = {
  configuration: Record<string, unknown>
  schema?: Record<string, unknown>
  epoch: string
} | null

export type FetchInput = Array<{
  component: string
  epoch: string
}>

export type FetchOutput = Array<{
  component: string
  epoch: string
  configuration: Record<string, unknown> | null
  created: number
}>

export type ListOutput = Array<{
  component: string
  epoch: string
  schema: Record<string, unknown>
  configuration: Record<string, unknown>
}>

export type CreateInput = {
  component: string
  configuration: Record<string, unknown>
  originator: {
    id: string
  }
}

export interface Component {
  get: (request: { input: GetInput, task?: boolean }, options?: Options) => Promise<GetOutput>
  fetch: (request: { input: FetchInput, task?: boolean }, options?: Options) => Promise<FetchOutput>
  list: (request: { input?: null, task?: boolean }, options?: Options) => Promise<ListOutput>
  create: (request: { input: CreateInput, task?: boolean }, options?: Options) => Promise<unknown | RemoteError<"UNKNOWN_COMPONENT" | "INVALID_CONFIGURATION">>
  assign: (request: { input?: null, query?: Query<Entity>, task?: boolean }, options?: Options) => Promise<Entity>
  ensure: (request: { input?: null, query?: Query<Entity>, task?: boolean }, options?: Options) => Promise<Entity>
  enumerate: (request: { input?: null, query?: Query<Entity>, task?: boolean }, options?: Options) => Promise<Entity[]>
  observe: (request: { input?: null, query?: Query<Entity>, task?: boolean }, options?: Options) => Promise<Entity | null>
  stream: (request: { input?: null, query?: Query<Entity>, task?: boolean }, options?: Options) => Promise<Readable>
  terminate: (request: { input?: null, query?: Query<Entity>, task?: boolean }, options?: Options) => Promise<Entity>
}
