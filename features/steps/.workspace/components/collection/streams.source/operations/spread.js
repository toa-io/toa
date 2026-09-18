import { Readable } from 'node:stream'

const CHUNK = 1024

/** Writes over time, so that what reads it can say whether it read over time too. */
export async function computation({ chunks }, context) {
  const content = Readable.from(payload(chunks), { objectMode: false })

  return await context.remote.streams.remote.timed({ input: { content } })
}

async function* payload(chunks) {
  for (let i = 0; i < chunks; i++) {
    await new Promise((resolve) => setTimeout(resolve, 20))

    yield Buffer.alloc(CHUNK, 1)
  }
}
