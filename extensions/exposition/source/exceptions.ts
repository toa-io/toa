import { type Exception } from '@toa.io/core'
import * as http from './HTTP'

export function rethrow (exception: Exception): void {
  // see /runtime/core/src/exceptions.js

  if ((exception.code >= 200 && exception.code < 210) || exception.code === 221)
    throw new http.BadRequest(exception.message)

  if (exception.code === 302)
    throw new http.NotFound()

  if (exception.code === 303)
    throw new http.PreconditionFailed()

  throw exception as unknown as Error
}
