import { type Exception } from '@toa.io/core'
import { match } from 'matchacho'
import * as http from './HTTP'

export function rethrow (exception: Exception): void {
  // see /runtime/core/src/exceptions.js

  throw match<Error>(exception.code,
    badRequest(exception), () => new http.BadRequest(exception.message),
    302, NOT_FOUND,
    303, PRECONDITION_FAILED,
    306, () => new http.Conflict(exception.message),
    () => exception)
}

function badRequest (exception: Exception) {
  return (code: number): boolean => {
    return (exception.code >= 200 && exception.code < 210) || exception.code === 221
  }
}

const NOT_FOUND = new http.NotFound()
const PRECONDITION_FAILED = new http.PreconditionFailed()
