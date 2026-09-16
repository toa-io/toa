/** Fails after it has started answering, which is what a trailer is for. */
export async function* computation(input) {
  const stream = input.content.stream ?? input.content

  let index = 0

  for await (const chunk of stream) {
    void chunk

    if (index === 2) throw new Error('nothing more to answer')

    yield { index: index++ }
  }
}
