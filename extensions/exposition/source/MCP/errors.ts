import * as http from '../HTTP/index.js'
import { JSONRPC, type Failure, type Response } from './types.js'

/* The five JSON-RPC 2.0 fixes, which mean the same to every client. */
export const PARSE = -32700
export const INVALID_REQUEST = -32600
export const METHOD_NOT_FOUND = -32601
export const INVALID_PARAMS = -32602
export const INTERNAL = -32603

/*
 * MCP's own. It reserves -32020 to -32099 for the specification and tells an implementation
 * to use nothing of -32000 to -32019 at all — which is where this gateway's JSON-RPC codes
 * sit, so none of them is answered here.
 */
export const HEADER_MISMATCH = -32020
export const MISSING_CAPABILITY = -32021
export const UNSUPPORTED_VERSION = -32022

export function failure (code: number, message: string, data?: unknown): Failure {
  const value: Failure = { code, message }

  if (data !== undefined)
    value.data = data

  return value
}

export function response (id: string | number | null, error: Failure): Response {
  return { jsonrpc: JSONRPC, id, error }
}

/**
 * What an exception says as a JSON-RPC error.
 *
 * The readable text is `body`, never `message`: `http.Exception` calls `super()` with no
 * argument, so every one of them carries an empty `message`.
 */
export function of (exception: unknown): Failure {
  if (exception instanceof http.NotFound || exception instanceof http.MethodNotAllowed)
    return failure(METHOD_NOT_FOUND, text(exception, 'Method not found'))

  if (exception instanceof http.BadRequest)
    return failure(INVALID_PARAMS, text(exception, 'Invalid params'))

  return failure(INTERNAL, 'Internal error')
}

/** What the operation refused with, which a model reads and may correct itself by. */
export function refusal (exception: http.UnprocessableEntity): string {
  const body = exception.body

  if (typeof body !== 'object' || body === null || typeof body.code !== 'string')
    return text(exception, 'Refused')

  const message = body.message as unknown

  return typeof message === 'string' && message !== '' ? message : body.code as string
}

function text (exception: http.Exception, fallback: string): string {
  return typeof exception.body === 'string' && exception.body !== ''
    ? exception.body
    : fallback
}
