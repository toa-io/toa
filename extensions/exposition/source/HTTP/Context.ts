import Negotiator from 'negotiator'
import { Timing } from './Timing'
import { type Format, formats, types } from './formats'
import { read } from './messages'
import type { OutgoingMessage } from './messages'
import type * as http from 'node:http'

export class Context {
  public readonly authority: string
  public readonly request: IncomingMessage
  public readonly url: URL
  public readonly subtype: string | null = null
  public readonly encoder: Format | null = null
  public readonly timing: Timing

  public readonly pipelines: Pipelines = {
    body: [],
    response: []
  }

  public constructor (authority: string, request: IncomingMessage, trace = false) {
    this.authority = authority
    this.request = request

    this.url = new URL(request.url, `https://${request.headers.host}`)
    this.timing = new Timing(trace)

    if (this.request.headers.accept !== undefined) {
      const match = SUBTYPE.exec(this.request.headers.accept)

      if (match !== null) {
        const {
          type,
          subtype,
          suffix
        } = match.groups!

        this.request.headers.accept = `${type}/${suffix}`
        this.subtype = subtype
      }
    }

    const negotiator = new Negotiator(this.request)
    const mediaType = negotiator.mediaType(types)

    if (mediaType !== undefined)
      this.encoder = formats[mediaType]
  }

  public async body<T> (): Promise<T> {
    const value = await read(this)

    return this.pipelines.body.length === 0
      ? value
      : this.pipelines.body.reduce((value, transform) => transform(value), value)
  }
}

export interface IncomingMessage extends http.IncomingMessage {
  url: string
  method: string
}

interface Pipelines {
  body: Array<(input: unknown) => unknown>
  response: Array<(output: OutgoingMessage) => void>
}

const SUBTYPE = /^(?<type>\w{1,32})\/(vnd\.toa\.(?<subtype>\S{1,32})\+)(?<suffix>\S{1,32})$/
