// Written by `toa types`. Every run rewrites it.
// What a manifest does not state belongs in a file of your own.

import type { Options, RemoteError } from '@toa.io/core/types'
import type { FetchInit } from '@toa.io/extensions.fetch'
import type { Stash } from '@toa.io/extensions.stash'
import type { Logs, Metrics, Span } from '@toa.io/extensions.telemetry'

export type CreateInput = {
  key?: string
  token?: string
}

export type PushInput = {
  data?: unknown
  key: string
  event: string
}

export type PushOutput = null

export type RouteInput = {
  event: string
  property?: string
  value?: string
  stream: string
  expose?: string[]
}

export type RouteOutput = null

export type UnrouteInput = {
  event: string
  property?: string
  value?: string
  stream: string
  expose?: string[]
}

export type UnrouteOutput = null

export type DispatchInput = {
  data?: unknown
  event: string
}

export type DispatchOutput = null

export interface Component {
  create: (request: { input: CreateInput, task?: boolean }, options?: Options) => Promise<unknown>
  push: (request: { input: PushInput, task?: boolean }, options?: Options) => Promise<PushOutput>
  route: (request: { input: RouteInput, task?: boolean }, options?: Options) => Promise<RouteOutput | RemoteError<"NOT_DYNAMIC" | "EXPOSE">>
  unroute: (request: { input: UnrouteInput, task?: boolean }, options?: Options) => Promise<UnrouteOutput>
  dispatch: (request: { input: DispatchInput, task?: boolean }, options?: Options) => Promise<DispatchOutput>
}

export interface Configuration {
  maxlen: number
  expire: number
}
