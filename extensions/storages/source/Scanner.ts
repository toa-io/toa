import { PassThrough, type TransformCallback } from 'node:stream'
import { createHash } from 'node:crypto'
import { negotiate } from '@toa.io/http'

export class Scanner extends PassThrough {
  public size = 0
  public type = 'application/octet-stream'
  public error: Error | null = null

  private readonly hash = createHash('md5')
  private readonly claim?: string
  private readonly accept?: string
  private position = 0
  private detected = false
  private readonly chunks: Buffer[] = []

  public constructor (control?: TypeControl) {
    super()

    this.claim = control?.claim
    this.accept = control?.accept
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
    const header = Buffer.concat(this.chunks).toString('hex')

    const signature = SIGNATURES
      .find(({ hex, off }) => header.slice(off, off + hex.length) === hex)

    const type = signature?.type ?? this.claim

    if (type !== undefined) {
      this.match(type)
      this.type = type
    }

    this.verify(signature)
    this.detected = true
  }

  private verify (signature: Signature | undefined): void {
    if (this.claim === undefined || this.claim === 'application/octet-stream')
      return

    const mismatch = signature === undefined
      ? KNOWN_TYPES.has(this.claim)
      : this.claim !== signature.type

    if (mismatch)
      this.interrupt(ERR_TYPE_MISMATCH)
  }

  private match (type: string): void {
    if (this.accept === undefined)
      return

    const unacceptable = negotiate(this.accept, [type]) === null

    if (unacceptable)
      this.interrupt(ERR_NOT_ACCEPTABLE)
  }

  private interrupt (error: Error): void {
    this.error = error
    this.end()
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
  When adding a new signature, include a copyright-free sample file in the `.tests` directory
  and update the 'signatures' test group in `Storage.test.ts`.
   */
]

const HEADER_SIZE = SIGNATURES
  .reduce((max, { off, hex }) => Math.max(max, off + hex.length), 0) / 2

const KNOWN_TYPES = new Set(SIGNATURES.map(({ type }) => type))

const ERR_TYPE_MISMATCH = new Error('TYPE_MISMATCH')
const ERR_NOT_ACCEPTABLE = new Error('NOT_ACCEPTABLE')

export interface TypeControl {
  claim?: string
  accept?: string
}

interface Signature {
  hex: string
  off: number
  type: string
}
