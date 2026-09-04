import * as http from '../HTTP/index.js'
import { VERSION, type Failure, type Response } from './types.js'

/*
 * The five the specification fixes (JSON-RPC 2.0 §5.1). A client reads these the same
 * whoever answers.
 */
export const PARSE = -32700
export const INVALID_REQUEST = -32600
export const METHOD_NOT_FOUND = -32601
export const INVALID_PARAMS = -32602
export const INTERNAL = -32603

/*
 * Ours. The specification reserves -32000 to -32099 for implementation-defined server
 * errors and defines nothing in it, so these mean nothing outside Toa — which is why
 * `REFUSED` carries the operation's own code in `data`.
 */
export const FORBIDDEN = -32000
export const REFUSED = -32001

export function failure (code: number, message: string, data?: unknown): Failure {
  const value: Failure = { code, message }

  if (data !== undefined)
    value.data = data

  return value
}

export function response (id: string | number | null, error: Failure): Response {
  return { jsonrpc: VERSION, id, error }
}

/**
 * What an exception says as a JSON-RPC error.
 *
 * The readable text is `body`, never `message`: `http.Exception` calls `super()` with no
 * argument, so every one of them carries an empty `message`.
 */
export function of (exception: unknown): Failure {
  if (exception instanceof http.UnprocessableEntity)
    return refusal(exception)

  if (exception instanceof http.NotFound || exception instanceof http.MethodNotAllowed)
    return failure(METHOD_NOT_FOUND, text(exception, 'Method not found'))

  if (exception instanceof http.Forbidden)
    return failure(FORBIDDEN, text(exception, 'Forbidden'))

  if (exception instanceof http.BadRequest)
    return failure(INVALID_PARAMS, text(exception, 'Invalid params'))

  // a conflict, a precondition, a throttle: the call was refused, and by what is worth saying
  if (exception instanceof http.ClientError)
    return failure(REFUSED, text(exception, 'Refused'), { status: exception.status })

  return failure(INTERNAL, 'Internal error')
}

/**
 * An operation that declares its errors answers with one rather than throwing, and the
 * reply contract states `{ code, message? }` — the message optional. The number says the
 * operation refused; `data.code` says what it refused with, and is what a caller branches on.
 */
function refusal (exception: http.UnprocessableEntity): Failure {
  const body = exception.body

  if (typeof body !== 'object' || body === null || typeof body.code !== 'string')
    return failure(REFUSED, text(exception, 'Refused'))

  const code = body.code as string
  const message = typeof body.message === 'string' && body.message !== '' ? body.message : code

  return failure(REFUSED, message, { code })
}

function text (exception: http.Exception, fallback: string): string {
  return typeof exception.body === 'string' && exception.body !== ''
    ? exception.body
    : fallback
}
