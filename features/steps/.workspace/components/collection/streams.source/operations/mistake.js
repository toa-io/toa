/** A value where a stream goes is refused before anything is sent. */
export async function computation({ label }, context) {
  return await context.remote.streams.sink.accept({ input: { label, content: 'not a stream' } })
}
