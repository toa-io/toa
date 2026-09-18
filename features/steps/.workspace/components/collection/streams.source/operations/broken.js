import { Readable } from 'node:stream'

/** A reply stream that fails after its first value fails the read, rather than ending it. */
export async function computation({ chunks }, context) {
  const content = Readable.from(payload(chunks), { objectMode: false })
  const reply = await context.remote.streams.remote.fails({ input: { content } })

  let read = 0

  try {
    for await (const value of reply) {
      void value
      read++
    }
  } catch {
    return { read, failed: true }
  }

  return { read, failed: false }
}

function* payload(chunks) {
  for (let i = 0; i < chunks; i++) yield Buffer.alloc(8, 1)
}
