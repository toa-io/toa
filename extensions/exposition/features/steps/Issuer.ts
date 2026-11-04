import * as http from 'node:http'
import * as http2 from 'node:http2'
import { buffer } from 'node:stream/consumers'
import { after, binding, given } from 'specumber'
import { environment } from '@toa.io/generic'

import { PORT } from './Parameters.ts'

/**
 * An issuer is named over `https`, at the host an authority maps to, and the gateway of
 * these features serves neither: what a component fetches from that origin is answered by
 * the gateway instead, addressed to the same host. `fetch` drops a `host` of its own, so the
 * request is made with `node:http`, or `node:http2` where the suite runs over h2c.
 */
@binding()
export class Issuer {
  private original: typeof globalThis.fetch | null = null

  @given('the issuer {word} is the Gateway')
  public reroute(issuer: string): void {
    const { origin, host } = new URL(issuer)
    const original = (this.original ??= globalThis.fetch)

    globalThis.fetch = async (input: string | URL | Request, init?: RequestInit) => {
      const request = new Request(input, init)
      const url = new URL(request.url)

      if (url.origin !== origin) return await original(input, init)

      return await forward(host, url.pathname + url.search, request)
    }
  }

  @after()
  public restore(): void {
    if (this.original === null) return

    globalThis.fetch = this.original
    this.original = null
  }
}

async function forward(host: string, path: string, request: Request): Promise<Response> {
  const headers: Record<string, string> = Object.fromEntries(request.headers)

  return environment.get('TOA_EXPOSITION_PROTOCOL') === 'h2c'
    ? await h2c(host, path, request.method, headers)
    : await h1(host, path, request.method, headers)
}

async function h1(
  host: string,
  path: string,
  method: string,
  headers: Record<string, string>
): Promise<Response> {
  const response = await new Promise<http.IncomingMessage>((resolve, reject) => {
    http
      .request({ port: PORT, path, method, headers: { ...headers, host } }, resolve)
      .on('error', reject)
      .end()
  })

  const body = await buffer(response)

  return new Response(body, {
    status: response.statusCode,
    headers: strings(response.headers)
  })
}

async function h2c(
  host: string,
  path: string,
  method: string,
  headers: Record<string, string>
): Promise<Response> {
  const session = http2.connect(`http://127.0.0.1:${PORT}`)

  try {
    const stream = session.request(
      {
        ...headers,
        ':method': method,
        ':path': path,
        ':authority': host
      },
      { endStream: true }
    )

    const [status, received] = await new Promise<[number, Record<string, string>]>(
      (resolve, reject) => {
        stream.on('response', (h) => {
          const { ':status': code, ...rest } = h

          resolve([Number(code), strings(rest)])
        })
        stream.on('error', reject)
      }
    )

    const body = await buffer(stream)

    return new Response(body, { status, headers: received })
  } finally {
    session.close()
  }
}

/** Headers as `Response` takes them: neither the symbols `node:http2` keys them with, nor lists. */
function strings(headers: object): Record<string, string> {
  return Object.fromEntries(
    Object.entries(headers)
      .filter(([, value]) => value !== undefined)
      .map(([name, value]) => [name, String(value)])
  )
}
