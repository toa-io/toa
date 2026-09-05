import { describe, it } from 'node:test'
import assert from 'node:assert/strict'

import * as http from '../HTTP/index.js'
import {
  FORBIDDEN, INTERNAL, INVALID_PARAMS, METHOD_NOT_FOUND, REFUSED, of
} from './errors.js'

describe('of', () => {
  it('should read a missing route as a missing method', () => {
    assert.deepEqual(of(new http.NotFound('pots/_id/FETCH names no method')),
      { code: METHOD_NOT_FOUND, message: 'pots/_id/FETCH names no method' })
  })

  it('should read a verb the node does not declare as a missing method', () => {
    assert.deepEqual(of(new http.MethodNotAllowed()),
      { code: METHOD_NOT_FOUND, message: 'Method not found' })
  })

  it('should read a refused authorization as forbidden', () => {
    assert.deepEqual(of(new http.Forbidden()), { code: FORBIDDEN, message: 'Forbidden' })
  })

  it('should read a bad request as invalid params', () => {
    assert.deepEqual(of(new http.BadRequest('Query limit must be between 1 and 100')),
      { code: INVALID_PARAMS, message: 'Query limit must be between 1 and 100' })
  })

  it('should carry the code an operation refused with', () => {
    const error = Object.assign(new Error(), { code: 'WONT_CREATE', message: 'Volume is out of range' })

    assert.deepEqual(of(new http.UnprocessableEntity(error)),
      { code: REFUSED, message: 'Volume is out of range', data: { code: 'WONT_CREATE' } })
  })

  it('should stand the code in for a message the operation did not declare', () => {
    const error = Object.assign(new Error(), { code: 'WONT_CREATE' })

    assert.deepEqual(of(new http.UnprocessableEntity(error)),
      { code: REFUSED, message: 'WONT_CREATE', data: { code: 'WONT_CREATE' } })
  })

  it('should say what any other client error was refused with', () => {
    assert.deepEqual(of(new http.Conflict()),
      { code: REFUSED, message: 'Refused', data: { status: 409 } })
  })

  it('should say nothing of what it did not mean to answer', () => {
    assert.deepEqual(of(new Error('the connection dropped')),
      { code: INTERNAL, message: 'Internal error' })
  })
})
