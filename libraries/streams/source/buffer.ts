import { type Readable } from 'node:stream'

export async function buffer (stream: Readable): Promise<Buffer> {
  const chunks = []

  for await (const chunk of stream) chunks.push(chunk)

  return Buffer.concat(chunks)
}
