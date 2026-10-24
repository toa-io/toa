// Written by `toa types`. Every run rewrites it.
// What a manifest does not state belongs in a file of your own.

import type { CodedError } from '@toa.io/core/types'
import type { Chronicles } from '@toa.io/extensions.chronicles'
import type { FetchInit } from '@toa.io/extensions.fetch'
import type { Logs, Metrics, Span } from '@toa.io/extensions.telemetry'

export type AnonymousInput = Record<string, unknown>

export type AnonymousOutput = {
  status?: number
  accepted?: number
}

export type IdentifiedInput = Record<string, unknown>

export type IdentifiedOutput = {
  status?: number
  accepted?: number
}

export type DescribeOutput = Record<string, unknown>

export interface Component {
  anonymous: (request: { input: AnonymousInput, task?: boolean }) => Promise<AnonymousOutput | CodedError<"INVALID" | "OVERSIZED">>
  identified: (request: { input: IdentifiedInput, task?: boolean }) => Promise<IdentifiedOutput | CodedError<"INVALID" | "OVERSIZED">>
  describe: (request: { input?: null, task?: boolean }) => Promise<DescribeOutput>
}

export interface Configuration Record<string, {
  /** What the client tells by sending it */
  description: string
  /** What each field of its payload is, by path */
  fields?: Record<string, string>
}>
