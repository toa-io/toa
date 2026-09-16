import { Readable } from 'node:stream'

/** Answers the bytes it was given, as bytes. */
export async function computation(input) {
  const stream = input.content.stream ?? input.content
  const chunks = []

  for await (const chunk of stream) chunks.push(chunk)

  return Readable.from(chunks, { objectMode: false })
}
