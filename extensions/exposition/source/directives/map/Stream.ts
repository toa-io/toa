import { Transform } from 'node:stream'
import Negotiator from 'negotiator'
import { Mapping } from './Mapping.ts'
import { toBytes } from '../octets/bytes.ts'
import * as http from '../../HTTP/index.ts'
import type { Readable } from 'node:stream'
import type { Input } from '../../io.ts'

const LIMIT = '64MiB'
const BYTES = 'application/octet-stream'

/**
 * Hands the request body to the operation as the stream it takes, instead of reading it.
 * See `/documentation/streams.md`.
 */
export class StreamMapping extends Mapping<Options> {
  private readonly property: string
  private readonly accept?: string[]
  private readonly produces?: string[]
  private readonly limit: number
  private readonly limitString: string

  public constructor(value: unknown) {
    const options = normalize(value)

    super(options)

    this.property = options.property
    this.accept = options.accept
    this.produces = options.produces
    this.limitString = options.limit ?? LIMIT
    this.limit = toBytes(this.limitString)
  }

  public override async properties(context: Input): Promise<Record<string, unknown>> {
    const type = context.request.headers['content-type']

    if (this.accept !== undefined && !acceptable(type, this.accept))
      throw new http.UnsupportedMediaType()

    // what a client states it is sending is refused before it is sent, where it states one
    const length = Number(context.request.headers['content-length'])

    if (Number.isFinite(length) && length > this.limit)
      throw new http.RequestEntityTooLarge(`Size limit is ${this.limitString}`)

    const accept = this.resolve(context)
    const stream = bounded(context.stream(), this.limit, context)

    return { [this.property]: { type: type ?? null, accept: accept ?? null, stream } }
  }

  protected override names(): string[] {
    return [this.property]
  }

  /**
   * One media type, or none: a client's `accept` is a list with quality values, and what an
   * operation can answer in is one of them. What is resolved here is what the response carries.
   */
  private resolve(context: Input): string | undefined {
    if (this.produces === undefined) return undefined

    const header = context.request.headers.accept

    if (header === undefined || header === '*/*') {
      context.answers = BYTES

      return BYTES
    }

    const negotiator = new Negotiator({ headers: { accept: header } })
    const [answer] = negotiator.mediaTypes(this.produces)

    if (answer === undefined) throw new http.NotAcceptable()

    context.answers = answer

    return answer
  }
}

/** Cuts a body that outgrows what the route takes, and says that it did. */
function bounded(source: Readable, limit: number, context: Input): Readable {
  let size = 0

  const transform = new Transform({
    transform(chunk: Buffer, _, callback) {
      size += chunk.length

      if (size > limit) {
        context.exceeded = true

        callback(new Error('The body outgrew what this route takes'))
      } else callback(null, chunk)
    }
  })

  source.pipe(transform)

  return transform
}

function acceptable(type: string | undefined, accept: string[]): boolean {
  if (type === undefined) return false

  const [media] = type.split(';')
  const [group] = media.split('/')

  return accept.some((one) => one === media || one === `${group}/*` || one === '*/*')
}

function normalize(value: unknown): Options {
  if (typeof value === 'string') return { property: value }

  if (value === null || typeof value !== 'object' || !('property' in value))
    throw new Error('`map:stream` is a property name, or an object naming one')

  return value as Options
}

export interface Options {
  property: string
  accept?: string[]
  produces?: string[]
  limit?: string
}
