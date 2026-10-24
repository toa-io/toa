// Written by `toa types`. Every run rewrites it.
// What a manifest does not state belongs in a file of your own.

import type { CodedError } from '@toa.io/core/types'

export type IngestInput = unknown[] | string

export type IngestOutput = {
  status?: number
  accepted?: number
}

export interface Component {
  ingest: (request: { input: IngestInput, task?: boolean }) => Promise<IngestOutput | CodedError<"INVALID" | "OVERSIZED">>
}
