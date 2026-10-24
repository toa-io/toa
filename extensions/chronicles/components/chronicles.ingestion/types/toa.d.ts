// Written by `toa types`. Every run rewrites it.
// What a manifest does not state belongs in a file of your own.

import type { CodedError } from '@toa.io/core/types'

export type AnonymousInput = Record<string, unknown> | string

export type AnonymousOutput = {
  status?: number
  accepted?: number
}

export type IdentifiedInput = Record<string, unknown> | string

export type IdentifiedOutput = {
  status?: number
  accepted?: number
}

export interface Component {
  anonymous: (request: { input: AnonymousInput, task?: boolean }) => Promise<AnonymousOutput | CodedError<"INVALID" | "OVERSIZED">>
  identified: (request: { input: IdentifiedInput, task?: boolean }) => Promise<IdentifiedOutput | CodedError<"INVALID" | "OVERSIZED">>
}
