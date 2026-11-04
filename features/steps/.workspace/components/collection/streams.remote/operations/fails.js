const RECORD = 8

/**
 * Fails after it has started answering, which is what a trailer is for. It answers a value per
 * record it read, because the chunks a body is read in are not the chunks it was written in.
 */
export async function* computation(input) {
  const stream = input.content.stream ?? input.content

  let pending = Buffer.alloc(0)
  let index = 0

  for await (const chunk of stream) {
    pending = Buffer.concat([pending, chunk])

    while (pending.length >= RECORD) {
      if (index === 2) throw new Error('nothing more to answer')

      yield { index: index++ }
      pending = pending.subarray(RECORD)
    }
  }
}
