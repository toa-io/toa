import { PassThrough, type TransformCallback } from 'node:stream'
import { createHash } from 'node:crypto'

export class Detector extends PassThrough {
  public size = 0
  public type = 'application/octet-stream'
  public error: Error | null = null

  private readonly hash = createHash('md5')
  private readonly assertion: string | undefined
  private position = 0
  private detected = false
  private readonly chunks: Buffer[] = []

  public constructor (assertion?: string) {
    super()

    this.assertion = assertion
  }

  public digest (): string {
    return this.hash.digest('hex')
  }

  public override _transform
  (buffer: Buffer, encoding: BufferEncoding, callback: TransformCallback): void {
    super._transform(buffer, encoding, callback)

    this.process(buffer)
  }

  private readonly process = (buffer: Buffer): void => {
    this.size += buffer.length
    this.hash.update(buffer)

    if (this.detected)
      return

    if (this.position + buffer.length > HEADER_SIZE)
      buffer = buffer.subarray(0, HEADER_SIZE - this.position)

    this.chunks.push(buffer)
    this.position += buffer.length

    if (this.position === HEADER_SIZE)
      this.complete()
  }

  private complete (): void {
    this.detected = true

    const header = Buffer.concat(this.chunks).toString('hex')

    const signature = SIGNATURES
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
const SIGNATURES: Signature[] = [
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
  When adding a new signature, please include a copyright-free sample file in the `.tests` directory
  and update the 'signatures' test group in `Storage.test.ts`.
   */
]

const HEADER_SIZE = SIGNATURES
  .reduce((max, { off, hex }) => Math.max(max, off + hex.length), 0) / 2

const KNOWN_TYPES = new Set(SIGNATURES.map(({ type }) => type))

const ERR_TYPE_MISMATCH = new Error('TYPE_MISMATCH')

interface Signature {
  hex: string
  off: number
  type: string
}
