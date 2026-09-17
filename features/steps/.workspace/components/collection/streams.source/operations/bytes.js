import { Readable } from 'node:stream'

/** Reads back bytes, as bytes. */
export async function computation({ chunks }, context) {
  const content = Readable.from(payload(chunks), { objectMode: false })
  const reply = await context.remote.streams.remote.relay({ input: { content } })

  let size = 0
  let buffers = true

  for await (const chunk of reply) {
    buffers &&= Buffer.isBuffer(chunk)
    size += chunk.length
  }

  return { size, buffers }
}

function* payload(chunks) {
  for (let i = 0; i < chunks; i++) yield Buffer.alloc(16, 1)
}
