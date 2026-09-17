/** An operation that takes a stream is not called without one. */
export async function computation({ label }, context) {
  return await context.remote.streams.sink.accept({ input: { label } })
}
