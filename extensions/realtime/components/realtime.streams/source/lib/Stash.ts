import type { Redis } from 'ioredis'

export class Stash {
  private readonly stash: Redis
  private readonly configuration: Configuration
  private readonly logs: any

  public constructor (stash: any, configuration: Configuration, logs: any) {
    this.stash = stash
    this.configuration = configuration
    this.logs = logs
  }

  public async connect (key: string): Promise<string | Error> {
    return await this.xadd(key, 'connect')
  }

  public async push (key: string, event: string, data: unknown): Promise<string | Error> {
    return await this.xadd(key, event, data)
  }

  public async pop (key: string, token: string): Promise<[string, Event[]] | null | Error> {
    const stamp = this.decode(token)

    const results = await this.stash
      .xread('STREAMS', key, stamp)
      .catch((error: Error) => error)

    if (results === null)
      return ERR_NO_RESULTS

    if (results instanceof Error)
      return results

    const items = entries(results)

    if (items === null)
      return null

    const events: Event[] = []

    let lastStamp: string | null = null

    for (const item of items) {
      const [, event, , json] = item[1]

      lastStamp = item[0]

      const data = json === undefined ? undefined : JSON.parse(json)

      if (data === undefined)
        this.logs.debug('Undefined event payload', { key, event })

      events.push({ event, data })
    }

    if (lastStamp === null)
      return null

    return [this.encode(lastStamp), events]
  }

  private async xadd (key: string, event: string, data?: unknown): Promise<string | Error> {
    const args = ['MAXLEN', '~', this.configuration.maxlen, '*', 'type', event]

    if (data !== undefined)
      args.push('data', JSON.stringify(data))

    const results = await this.stash
      .multi()
      .xadd(key, ...args)
      .expire(key, this.configuration.expire)
      .exec()
      .catch((error: Error) => error)

    if (results === null)
      return ERR_NO_RESULTS

    if (results instanceof Error)
      return results

    const [[error, stamp]] = results

    if (error !== null)
      return error

    return this.encode(stamp as string)
  }

  private encode (token: string): string {
    return Buffer.from(token).toString('base64url')
  }

  private decode (token: string): string {
    return Buffer.from(token, 'base64url').toString()
  }
}

/**
 * `xread` answers with an array of `[stream, entries]` pairs over RESP2 and with an
 * object keyed by stream name over RESP3. One stream is read, so either way it is the
 * first, and an empty answer means nothing has been added since the token.
 */
function entries (results: unknown): Entry[] | null {
  if (Array.isArray(results))
    return results.length === 0 ? null : (results[0] as [string, Entry[]])[1]

  if (typeof results === 'object' && results !== null) {
    const streams = Object.values(results as Record<string, Entry[]>)

    return streams.length === 0 ? null : streams[0]
  }

  return null
}

type Entry = [stamp: string, fields: string[]]

interface Configuration {
  maxlen: number
  expire: number
}

interface Event {
  event: string
  data: unknown
}

class NoResultsError extends Error {
  public readonly code = 'NO_RESULTS'
}

const ERR_NO_RESULTS = new NoResultsError()
