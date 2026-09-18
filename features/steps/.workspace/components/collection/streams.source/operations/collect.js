import { Readable } from 'node:stream'

/** Reads back what the operation answered, value by value. */
export async function computation({ chunks }, context) {
  const content = Readable.from(payload(chunks), { objectMode: false })
  const reply = await context.remote.streams.remote.echo({ input: { content } })
  const values = []

  for await (const value of reply) values.push(value)

  return values
}

function* payload(chunks) {
  for (let i = 0; i < chunks; i++) yield Buffer.alloc(8, 1)
}
