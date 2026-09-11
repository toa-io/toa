import * as http from 'node:http'
import * as http2 from 'node:http2'

export interface Request {
  method: string
  path: string
  headers?: Record<string, string>
  body?: string
}

export interface Reply {
  status: number
  headers: Record<string, string | string[] | undefined>
  body: unknown
}

/** One side's gateway, over the protocol it serves. */
export class Client {
  private readonly origin: string
  private readonly authority: string
  private readonly protocol: 'h1' | 'h2c'
  private readonly agent = new http.Agent({ keepAlive: true, maxSockets: 32 })
  private session: http2.ClientHttp2Session | null = null

  public constructor(origin: string, authority: string, protocol: 'h1' | 'h2c') {
    this.origin = origin
    this.authority = authority
    this.protocol = protocol
  }

  public async send(request: Request): Promise<Reply> {
    return this.protocol === 'h2c' ? await this.h2c(request) : await this.h1(request)
  }

  public close(): void {
    this.agent.destroy()
    this.session?.close()
    this.session = null
  }

  private async h1(request: Request): Promise<Reply> {
    const { method, path, headers, body } = request

    return await new Promise((resolve, reject) => {
      const outgoing = http.request(
        new URL(path, this.origin),
        {
          method,
          agent: this.agent,
          headers: { host: this.authority, accept: 'application/json', ...headers }
        },
        (incoming) => {
          const chunks: Buffer[] = []

          incoming
            .on('data', (chunk: Buffer) => chunks.push(chunk))
            .on('end', () =>
              resolve({
                status: incoming.statusCode ?? 0,
                headers: incoming.headers,
                body: decode(Buffer.concat(chunks), incoming.headers['content-type'])
              })
            )
            .on('error', reject)
        }
      )

      outgoing.setTimeout(TIMEOUT, () =>
        outgoing.destroy(new Error(`No reply to ${method} ${path} within ${TIMEOUT} ms`))
      )
      outgoing.on('error', reject)
      outgoing.end(body)
    })
  }

  private async h2c(request: Request): Promise<Reply> {
    const { method, path, headers, body } = request

    if (this.session === null) {
      const session = http2.connect(this.origin)

      // a failed session is dropped, and the stream that saw it rejects on its own
      session.on('error', () => undefined)
      session.on('close', () => {
        if (this.session === session) this.session = null
      })

      this.session = session
    }

    const session = this.session

    return await new Promise((resolve, reject) => {
      const stream = session.request({
        ':method': method,
        ':path': path,
        ':authority': this.authority,
        accept: 'application/json',
        ...headers
      })

      const chunks: Buffer[] = []
      let status = 0
      let received: http2.IncomingHttpHeaders = {}

      stream.setTimeout(TIMEOUT, () => {
        stream.close(http2.constants.NGHTTP2_CANCEL)
        reject(new Error(`No reply to ${method} ${path} within ${TIMEOUT} ms`))
      })

      stream
        .on('response', (response) => {
          status = Number(response[':status'])
          received = response
        })
        .on('data', (chunk: Buffer) => chunks.push(chunk))
        .on('end', () =>
          resolve({
            status,
            headers: received,
            body: decode(Buffer.concat(chunks), received['content-type'])
          })
        )
        .on('error', reject)

      stream.end(body)
    })
  }
}

function decode(buffer: Buffer, type: string | string[] | undefined): unknown {
  if (typeof type === 'string' && type.includes('json'))
    return buffer.length === 0 ? null : JSON.parse(buffer.toString('utf8'))

  return buffer
}

const TIMEOUT = 10_000
