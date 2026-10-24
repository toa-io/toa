// Written by `toa types`. Every run rewrites it.
// What a manifest does not state belongs in a file of your own.

import type { CodedError } from '@toa.io/core/types'

export type DescribeOutput = {
  /** What a query is written in */
  dialect?: string
  labels?: unknown[]
  states?: unknown[]
  views?: unknown[]
}

export type QueryInput = {
  /** One statement over the log, in the dialect `describe` names */
  sql: string
}

export type QueryOutput = {
  columns?: unknown[]
  rows?: unknown[]
  truncated?: boolean
}

export type DefineInput = {
  /** The view's name, which is what a query reads it by */
  name: string
  /** The statement the view is, one a query could run */
  sql: string
  /** Seconds between computations of a materialized view; absent, a plain view */
  refresh?: number
}

export type DropInput = {
  /** The view's name, which is what a query reads it by */
  name: string
}

export interface Component {
  describe: (request: { input?: null, task?: boolean }) => Promise<DescribeOutput>
  query: (request: { input: QueryInput, task?: boolean }) => Promise<QueryOutput | CodedError<"REFUSED">>
  define: (request: { input: DefineInput, task?: boolean }) => Promise<{} | null | undefined | CodedError<"REFUSED" | "RESERVED" | "EXHAUSTED">>
  drop: (request: { input: DropInput, task?: boolean }) => Promise<{} | null | undefined | CodedError<"NOT_FOUND">>
}
