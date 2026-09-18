import { Readable } from 'node:stream'

const CHUNK = 1024

/** Calls a component of another process, which is what carries the stream over HTTP. */
export async function computation({ label, chunks }, context) {
  const content = Readable.from(payload(chunks), { objectMode: false })

  return await context.remote.streams.remote.accept({ input: { label, content } })
}

function* payload(chunks) {
  for (let i = 0; i < chunks; i++) yield Buffer.alloc(CHUNK, 1)
}
