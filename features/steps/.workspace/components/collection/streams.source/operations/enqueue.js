import { Readable } from 'node:stream'

/** A stream cannot be handed to whoever takes the task later. */
export async function computation({ chunks }, context) {
  const content = Readable.from([Buffer.alloc(chunks, 1)], { objectMode: false })

  return await context.remote.streams.sink.accept({ input: { content }, task: true })
}
