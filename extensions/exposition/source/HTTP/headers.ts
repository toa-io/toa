import type * as http from 'node:http'

export function logHeaders (headers: http.IncomingMessage['headers']): void {
  if (headers instanceof Headers)
    for (const header of headers.entries())
      console.debug(`${header[0]}: ${header[0] in ALLOWED_HEADERS ? header[1] : '...'}`)
}

enum ALLOWED_HEADERS {
  accept = 'accept',
  'accept-language' = 'accept-language',
  'accept-patch' = 'accept-patch',
  'accept-ranges' = 'accept-ranges',
  'access-control-allow-credentials' = 'access-control-allow-credentials',
  'access-control-allow-headers' = 'access-control-allow-headers',
  'access-control-allow-methods' = 'access-control-allow-methods',
  'access-control-allow-origin' = 'access-control-allow-origin',
  'access-control-expose-headers' = 'access-control-expose-headers',
  'access-control-max-age' = 'access-control-max-age',
  'access-control-request-headers' = 'access-control-request-headers',
  'access-control-request-method' = 'access-control-request-method',
  age = 'age',
  allow = 'allow',
  'cache-control' = 'cache-control',
  'content-disposition' = 'content-disposition',
  'content-encoding' = 'content-encoding',
  'content-language' = 'content-language',
  'content-length' = 'content-length',
  'content-location' = 'content-location',
  'content-range' = 'content-range',
  'content-type' = 'content-type',
  date = 'date',
  etag = 'etag',
  expect = 'expect',
  expires = 'expires',
  forwarded = 'forwarded',
  from = 'from',
  host = 'host',
  'if-match' = 'if-match',
  'if-modified-since' = 'if-modified-since',
  'if-none-match' = 'if-none-match',
  'if-unmodified-since' = 'if-unmodified-since',
  'last-modified' = 'last-modified',
  origin = 'origin',
  range = 'range',
  referer = 'referer',
  'retry-after' = 'retry-after',
  'transfer-encoding' = 'transfer-encoding',
  'user-agent' = 'user-agent',
  vary = 'vary',
  via = 'via',
  warning = 'warning'
}
