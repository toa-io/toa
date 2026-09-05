/** The version every call and every response states. */
export const VERSION = '2.0'

/**
 * The member `params` reserves for what a querystring would carry. An operation's input is
 * free to have an `id` or a `limit` of its own, so the two cannot share one object.
 */
export const QUERY = 'query'

export type Params = Record<string, unknown>

export interface Call {
  jsonrpc: string
  method: string
  params?: Params

  /** Absent makes this a notification: it runs, and nothing is returned for it. */
  id?: string | number
}

export interface Response {
  jsonrpc: string

  /** `null` where the request was not readable enough to carry one. */
  id: string | number | null
  result?: unknown
  error?: Failure
}

export interface Failure {
  code: number
  message: string
  data?: unknown
}
