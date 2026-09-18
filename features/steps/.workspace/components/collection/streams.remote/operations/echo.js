/** Answers a value per chunk it read: a stream in, a stream of values out. */
export async function* computation(input) {
  const stream = input.content.stream ?? input.content

  let index = 0

  for await (const chunk of stream) yield { index: index++, size: chunk.length }
}
