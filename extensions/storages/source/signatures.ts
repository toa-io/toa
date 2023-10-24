import { PassThrough, type Readable } from 'node:stream'
import { promex } from '@toa.io/generic'

export async function detect (stream: Readable, assertion?: string): Promise<string | Error> {
  const pass = new PassThrough()
  const chunks: Buffer[] = []
  const reading = promex<string>()

  let position = 0

  stream.pipe(pass)

  pass.on('data', (buffer) => {
    if (position + buffer.length > HEADER_SIZE)
      buffer = buffer.slice(0, HEADER_SIZE - position)

    chunks.push(buffer)
    position += buffer.length

    if (position === HEADER_SIZE)
      pass.end()

    reading.resolve(Buffer.concat(chunks).toString('hex'))
  })

  const bytes = await reading

  const signature = signatures
    .find(({ hex, offset }) => bytes.substring(offset, offset + hex.length) === hex)

  if (signature === undefined && assertion !== undefined && TYPES.includes(assertion))
    return ERR_TYPE_MISMATCH

  const type = signature?.type ?? assertion ?? 'application/octet-stream'

  if (assertion !== undefined && assertion !== 'application/octet-stream' && assertion !== type) {
    stream.destroy()

    return ERR_TYPE_MISMATCH
  }

  return type
}

// https://en.wikipedia.org/wiki/List_of_file_signatures
const signatures: Signature[] = [
  { type: 'image/jpeg', hex: 'ffd8ffe0', offset: 0 },
  { type: 'image/jpeg', hex: 'ffd8ffe1', offset: 0 },
  { type: 'image/jpeg', hex: 'ffd8ffee', offset: 0 },
  { type: 'image/jpeg', hex: 'ffd8ffdb', offset: 0 },
  { type: 'image/png', hex: '89504e47', offset: 0 },
  { type: 'image/gif', hex: '47494638', offset: 0 },
  { type: 'image/webp', hex: '52494646', offset: 0 },
  { type: 'image/heic', hex: '66747970', offset: 8 }
]

const HEADER_SIZE = signatures
  .reduce((max, { offset, hex }) => Math.max(max, offset + hex.length), 0)

const TYPES = signatures.map(({ type }) => type)

const ERR_TYPE_MISMATCH = new Error('TYPE_MISMATCH')

interface Signature {
  type: string
  hex: string
  offset: number
}
