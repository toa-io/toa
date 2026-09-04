// Written by `toa types`. Every run rewrites it.
// What a manifest does not state belongs in a file of your own.

import type { RemoteError } from '@toa.io/core'

export type PutInput = {
  location?: string
  accept?: string
  limit?: number
  trust?: unknown
  storage: string
  request: unknown
}

export type GetInput = {
  range?: string
  agent?: string
  storage: string
  path: string
}

export type HeadInput = {
  range?: string
  agent?: string
  storage: string
  path: string
}

export type DeleteInput = {
  range?: string
  agent?: string
  storage: string
  path: string
}

export interface Component {
  put: (request: { input: PutInput, task?: boolean }) => Promise<unknown | RemoteError<"LOCATION_UNTRUSTED" | "LOCATION_LENGTH" | "LOCATION_UNAVAILABLE" | "INVALID_ID" | "NOT_FOUND" | "LIMIT_EXCEEDED" | "NOT_ACCEPTABLE" | "TYPE_MISMATCH">>
  get: (request: { input: GetInput, task?: boolean }) => Promise<unknown | RemoteError<"NOT_FOUND" | "LIMIT_EXCEEDED" | "NOT_ACCEPTABLE" | "TYPE_MISMATCH">>
  head: (request: { input: HeadInput, task?: boolean }) => Promise<unknown | RemoteError<"NOT_FOUND" | "LIMIT_EXCEEDED" | "NOT_ACCEPTABLE" | "TYPE_MISMATCH">>
  delete: (request: { input: DeleteInput, task?: boolean }) => Promise<unknown | RemoteError<"NOT_FOUND" | "LIMIT_EXCEEDED" | "NOT_ACCEPTABLE" | "TYPE_MISMATCH">>
}
