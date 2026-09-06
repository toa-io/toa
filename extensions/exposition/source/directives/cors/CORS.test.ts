import { describe, it, beforeEach } from 'node:test'
import assert from 'node:assert/strict'

import { CORS } from './CORS.js'
import type { Input } from '../../io.js'

const input = (method: string, headers: Record<string, string>): Input =>
  ({
    request: { method, headers },
    pipelines: { body: [], response: [] }
  }) as unknown as Input

describe('cors', () => {
  let cors: CORS

  beforeEach(() => {
    cors = new CORS()
    cors.reset()
  })

  it('should answer a preflight', () => {
    const output = cors.intercept(
      input('OPTIONS', {
        origin: 'https://hello.world',
        'access-control-request-method': 'GET'
      })
    )

    assert.equal(output?.status, 204)
    assert.equal(output?.headers?.get('access-control-allow-origin'), 'https://hello.world')
  })

  it('should allow OPTIONS, so that one can be preflighted at all', () => {
    const output = cors.intercept(
      input('OPTIONS', {
        origin: 'https://hello.world',
        'access-control-request-method': 'OPTIONS'
      })
    )

    assert.match(output?.headers?.get('access-control-allow-methods') ?? '', /\bOPTIONS\b/)
  })

  it('should pass an OPTIONS that is not a preflight through', () => {
    /*
     * A browser puts `Origin` on every request whose method is not `GET` or `HEAD`, its own
     * `OPTIONS` included — so answering this one here would put introspection out of reach
     * of any page. Do not restore the `Origin`-only test.
     */
    const output = cors.intercept(input('OPTIONS', { origin: 'https://hello.world' }))

    assert.equal(output, null)
  })

  it('should decorate a reply that is not a preflight', () => {
    const request = input('OPTIONS', { origin: 'https://hello.world' })

    cors.intercept(request)

    const message = {}

    for (const transform of request.pipelines.response) transform(message)

    const headers = (message as { headers?: Headers }).headers

    assert.equal(headers?.get('access-control-allow-origin'), 'https://hello.world')
    assert.equal(headers?.get('access-control-allow-credentials'), 'true')
    assert.equal(headers?.get('vary'), 'origin')
  })

  it('should pass a request carrying no origin through', () => {
    assert.equal(cors.intercept(input('OPTIONS', {})), null)
    assert.equal(cors.intercept(input('GET', {})), null)
  })
})
