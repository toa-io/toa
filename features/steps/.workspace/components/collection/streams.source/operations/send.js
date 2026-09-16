import { Readable } from 'node:stream'

const CHUNK = 1024

export async function computation({ label, chunks }, context) {
  const content = Readable.from(payload(chunks), { objectMode: false })

  return await context.remote.streams.sink.accept({ input: { label, content } })
}

function* payload(chunks) {
  for (let i = 0; i < chunks; i++) yield Buffer.alloc(CHUNK, 1)
}
