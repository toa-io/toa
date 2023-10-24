import { PassThrough, type Readable } from 'node:stream'
import { promex } from '@toa.io/generic'

export async function detect (stream: Readable, type?: string): Promise<string | Error> {
  const pass = new PassThrough()
  const chunks: Buffer[] = []
  const header = promex<string>()

  let position = 0

  stream.pipe(pass)

  pass.on('data', (buffer) => {
    if (position + buffer.length > HEADER_SIZE)
      buffer = buffer.slice(0, HEADER_SIZE - position)

    chunks.push(buffer)
    position += buffer.length

    if (position === HEADER_SIZE)
      pass.end()

    const value = Buffer.concat(chunks).toString('hex')

    header.resolve(value)
  })

  const bytes = await header

  const signature = signatures
    .find(({ hex, offset }) => bytes.substring(offset, offset + hex.length) === hex)

  if (type !== undefined && type !== 'application/octet-stream') {
    const mismatch = signature === undefined
      ? KNOWN_TYPES.has(type)
      : type !== signature.type

    if (mismatch) {
      stream.destroy()

      return ERR_TYPE_MISMATCH
    }
  }

  return signature?.type ?? type ?? 'application/octet-stream'
}

// https://en.wikipedia.org/wiki/List_of_file_signatures
const signatures: Signature[] = [
  { hex: 'ffd8ffe0', offset: 0, type: 'image/jpeg' },
  { hex: 'ffd8ffe1', offset: 0, type: 'image/jpeg' },
  { hex: 'ffd8ffee', offset: 0, type: 'image/jpeg' },
  { hex: 'ffd8ffdb', offset: 0, type: 'image/jpeg' },
  { hex: '89504e47', offset: 0, type: 'image/png' },
  { hex: '47494638', offset: 0, type: 'image/gif' },
  { hex: '52494646', offset: 0, type: 'image/webp' },
  { hex: '4a584c200d0a870a', offset: 8, type: 'image/jxl' },
  { hex: '6674797068656963', offset: 8, type: 'image/heic' },
  { hex: '6674797061766966', offset: 8, type: 'image/avif' }
  /*
  When adding new signatures, add a copyright free sample file to the `.tests`
  and update the "signatures" test group in `Storage.test.ts`.
   */
]

'66 74 79 70 68 65 69 666 74 79 70 6d'.toLowerCase() // equals '66747970686569667479706d'

const HEADER_SIZE = signatures
  .reduce((max, { offset, hex }) => Math.max(max, offset + hex.length), 0)

const KNOWN_TYPES = new Set(signatures.map(({ type }) => type))

const ERR_TYPE_MISMATCH = new Error('TYPE_MISMATCH')

interface Signature {
  type: string
  hex: string
  offset: number
}
