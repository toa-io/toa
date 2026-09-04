// Written by `toa types`. Every run rewrites it.
// What a manifest does not state belongs in a file of your own.

import type { FetchInit } from '@toa.io/extensions.fetch'
import type { Stash } from '@toa.io/extensions.stash'
import type { Logs, Span } from '@toa.io/extensions.telemetry'

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

export interface Component {
  create: (request: { input: CreateInput, task?: boolean }) => Promise<unknown>
  push: (request: { input: PushInput, task?: boolean }) => Promise<PushOutput>
}

export interface Configuration {
  maxlen: number
  expire: number
}
