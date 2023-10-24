import { PassThrough } from 'node:stream'

export class Detector extends PassThrough {
  public type: string = 'application/octet-stream'
  public error: Error | null = null

  private readonly assertion: string | undefined
  private position = 0
  private readonly chunks: Buffer[] = []

  public constructor (assertion?: string) {
    super()

    this.assertion = assertion
  }

  public override _transform (buffer: Buffer, _: string, callback: Callback): void {
    this.append(buffer)
    this.push(buffer)

    callback()
  }

  private readonly append = (buffer: Buffer): void => {
    if (this.position + buffer.length > HEADER_SIZE)
      buffer = buffer.subarray(0, HEADER_SIZE - this.position)

    this.chunks.push(buffer)
    this.position += buffer.length

    if (this.position === HEADER_SIZE)
      this.detect()
  }

  private detect (): void {
    const header = Buffer.concat(this.chunks).toString('hex')

    const signature = signatures
      .find(({ hex, off }) => header.slice(off, off + hex.length) === hex)

    this.verify(signature)

    const value = signature?.type ?? this.assertion

    if (value !== undefined)
      this.type = value
  }

  private verify (signature: Signature | undefined): void {
    if (this.assertion === undefined || this.assertion === 'application/octet-stream')
      return

    const mismatch = signature === undefined
      ? KNOWN_TYPES.has(this.assertion)
      : this.assertion !== signature.type

    if (mismatch) {
      this.error = ERR_TYPE_MISMATCH
      this.end()
    }
  }
}

// https://en.wikipedia.org/wiki/List_of_file_signatures
const signatures: Signature[] = [
  { hex: 'ffd8ffe0', off: 0, type: 'image/jpeg' },
  { hex: 'ffd8ffe1', off: 0, type: 'image/jpeg' },
  { hex: 'ffd8ffee', off: 0, type: 'image/jpeg' },
  { hex: 'ffd8ffdb', off: 0, type: 'image/jpeg' },
  { hex: '89504e47', off: 0, type: 'image/png' },
  { hex: '47494638', off: 0, type: 'image/gif' },
  { hex: '52494646', off: 0, type: 'image/webp' },
  { hex: '4a584c200d0a870a', off: 8, type: 'image/jxl' },
  { hex: '6674797068656963', off: 8, type: 'image/heic' },
  { hex: '6674797061766966', off: 8, type: 'image/avif' }
  /*
  When adding new signatures, add copyright-free sample file to the `.tests` directory
  and update the "signatures" test group in `Storage.test.ts`.
   */
]

const HEADER_SIZE = signatures
  .reduce((max, { off, hex }) => Math.max(max, off + hex.length), 0) / 2

const KNOWN_TYPES = new Set(signatures.map(({ type }) => type))

const ERR_TYPE_MISMATCH = new Error('TYPE_MISMATCH')

interface Signature {
  hex: string
  off: number
  type: string
}

type Callback = (error?: Error, data?: Buffer) => void
