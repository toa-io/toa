import { type Exception } from '@toa.io/core'
import { match } from 'matchacho'
import * as http from './HTTP'

export function rethrow (exception: Exception): void {
  // see /runtime/core/src/exceptions.js

  throw match<Error>(exception.code,
    badRequest, () => new http.BadRequest(exception.message),
    302, NOT_FOUND,
    303, PRECONDITION_FAILED,
    306, () => new http.Conflict(),
    () => exception)
}

function badRequest (code: number): boolean {
  return (code >= 200 && code < 210) || code === 221
}

const NOT_FOUND = new http.NotFound()
const PRECONDITION_FAILED = new http.PreconditionFailed()
