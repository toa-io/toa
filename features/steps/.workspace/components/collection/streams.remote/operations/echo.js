const RECORD = 8

/**
 * Answers a value per record it read: a stream in, a stream of values out. The bytes are cut into
 * records of their own, because the chunks a body is read in are not the chunks it was written in.
 */
export async function* computation(input) {
  const stream = input.content.stream ?? input.content

  let pending = Buffer.alloc(0)
  let index = 0

  for await (const chunk of stream) {
    pending = Buffer.concat([pending, chunk])

    while (pending.length >= RECORD) {
      yield { index: index++, size: RECORD }
      pending = pending.subarray(RECORD)
    }
  }

  if (pending.length > 0) yield { index: index++, size: pending.length }
}
