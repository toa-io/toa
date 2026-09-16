import * as http from 'node:http'
import { Connector, exceptions } from '@toa.io/core'
import { address } from './address.ts'
import { HEADER, PATH, detach } from './envelope.ts'
import { read } from './reply.ts'
import { path } from './Producer.ts'
import type { Readable } from 'node:stream'
import type { Locator } from '@toa.io/core'
import type { bindings, Reply, Request } from '@toa.io/core/types'

/**
 * Carries a call that holds a stream, and nothing else: what a call without one is answered with
 * is `false`, and the transmission goes on to the binding beside this one.
 */
export class Consumer extends Connector {
  private readonly locator: Locator
  private readonly endpoint: string

  public constructor(locator: Locator, endpoint: string) {
    super()

    this.locator = locator
    this.endpoint = endpoint
  }

  public async request(
    request: Request,
    terms?: bindings.Terms
  ): Promise<Reply | Readable | false> {
    const carried = detach(request)

    if (carried === undefined) return false

    const url = new URL(path(this.locator, this.endpoint), address(this.locator))

    return await this.send(url, carried.envelope, carried.path, carried.stream, terms)
  }

  // eslint-disable-next-line max-params
  private async send(
    url: URL,
    envelope: Request,
    property: string,
    stream: Readable,
    terms?: bindings.Terms
  ): Promise<Reply | Readable> {
    const message = await new Promise<http.IncomingMessage>((resolve, reject) => {
      const request = http.request(
        url,
        {
          method: 'POST',
          // a connection kept for the next call would send it where this one went
          agent: false,
          signal: terms?.signal,
          headers: {
            [HEADER]: JSON.stringify(envelope),
            [PATH]: property,
            'content-type': 'application/octet-stream'
          }
        },
        resolve
      )

      request.on('error', reject)

      stream.pipe(request)
    }).catch((error: unknown) => {
      throw unreachable(url, error)
    })

    if (message.statusCode === 404)
      throw new exceptions.UnreachableException(
        `Nothing at '${url.host}' serves '${this.locator.id}.${this.endpoint}'`
      )

    return read(message)
  }
}

/** A replica that is starting, restarting or being deployed is one that answers in a moment. */
function unreachable(url: URL, error: unknown): unknown {
  const code = (error as { code?: string }).code

  if (code === undefined) return error

  return new exceptions.UnreachableException(
    `Nothing answered at '${url.host}' (${code})`,
    error
  )
}
