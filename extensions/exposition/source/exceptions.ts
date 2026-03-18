import { match } from 'matchacho'
import { console } from 'openspan'
import * as http from './HTTP'
import { Exception as HTTPException } from './HTTP'
import type { Exception } from '@toa.io/core'

export function rethrow (exception: Exception | HTTPException): void {
  if (exception instanceof HTTPException)
    throw exception

  // see /runtime/core/src/exceptions.js
  throw match(exception.code,
    badRequest, () => new http.BadRequest(exception.message),
    CORE_EXCEPTIONS.StateNotFound, NOT_FOUND,
    CORE_EXCEPTIONS.StatePrecondition, PRECONDITION_FAILED,
    CORE_EXCEPTIONS.Duplicate, CONFLICT,
    CORE_EXCEPTIONS.StateConcurrency, CONFLICT,
    CORE_EXCEPTIONS.EntityGuard, CONFLICT,
    () => {
      console.error('Request processing exception', exception)

      return exception
    })
}

function badRequest (code: number): boolean {
  return (code >= 200 && code < 210) || code === 221
}

const NOT_FOUND = new http.NotFound()
const PRECONDITION_FAILED = new http.PreconditionFailed()
const CONFLICT = new http.Conflict()

const CORE_EXCEPTIONS = {
  StateNotFound: 302,
  StatePrecondition: 303,
  StateConcurrency: 304,
  EntityGuard: 213,
  Duplicate: 306
}
