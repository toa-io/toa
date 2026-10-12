import { describe, it } from 'node:test'
import assert from 'node:assert/strict'

import { CORS } from './CORS.ts'
import type { Input } from '../../io.ts'

const input = (method: string, headers: Record<string, string>): Input =>
  ({
    request: { method, headers },
    pipelines: { body: [], response: [] }
  }) as unknown as Input

const preflight = (method: string): Input =>
  input('OPTIONS', {
    origin: 'https://hello.world',
    'access-control-request-method': method
  })

describe('cors', () => {
  const cors = new CORS()

  it('should answer a preflight', () => {
    const output = cors.intercept(preflight('GET'))

    assert.equal(output?.status, 204)
    assert.equal(output?.headers?.get('access-control-allow-headers'), '*, authorization')
    assert.equal(output?.headers?.get('access-control-max-age'), '86400')
  })

  it('should allow OPTIONS, so that one can be preflighted at all', () => {
    const output = cors.intercept(preflight('OPTIONS'))

    assert.match(
      output?.headers?.get('access-control-allow-methods') ?? '',
      /\bOPTIONS\b/
    )
  })

  it('should answer each preflight with headers of its own', () => {
    const one = cors.intercept(preflight('GET'))
    const another = cors.intercept(preflight('GET'))

    one?.headers?.set('access-control-max-age', '0')

    assert.equal(another?.headers?.get('access-control-max-age'), '86400')
  })

  it('should pass an OPTIONS that is not a preflight through', () => {
    /*
     * A browser puts `Origin` on every request whose method is not `GET` or `HEAD`, its own
     * `OPTIONS` included — so answering this one here would put introspection out of reach
     * of any page. Do not restore the `Origin`-only test.
     */
    const request = input('OPTIONS', { origin: 'https://hello.world' })

    assert.equal(cors.intercept(request), null)
  })

  it('should pass a request carrying no origin through', () => {
    assert.equal(cors.intercept(input('OPTIONS', {})), null)
    assert.equal(cors.intercept(input('GET', {})), null)
  })
})
