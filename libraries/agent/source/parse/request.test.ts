import { it } from 'node:test'
import assert from 'node:assert/strict'

import { request } from './request.js'

it('should parse headers', () => {
  const http =
    'GET / HTTP/1.1\n' +
    'host: localhost:3000\n' +
    '\n'

  const result = request(http)

  assert.deepStrictEqual(result.headers.get('host'), 'localhost:3000')
})

it('should parse body', () => {
  const http =
    'POST / HTTP/1.1\n' +
    'host: localhost:3000\n' +
    'content-type: text/plain\n' +
    'content-length: 11\n' +
    '\n' +
    'hello world'

  const result = request(http)

  assert.deepStrictEqual(result.body?.toString(), 'hello world')
  assert.deepStrictEqual(result.headers.get('host'), 'localhost:3000')
})

it('should add default host header', () => {
  const http =
    'GET / HTTP/1.1\n' +
    '\n'

  const result = request(http, 'https://foo.bar')

  assert.deepStrictEqual(result.headers.get('host'), 'foo.bar')
})
