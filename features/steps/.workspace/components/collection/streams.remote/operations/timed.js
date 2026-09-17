/**
 * Answers whether the bytes flowed: a body that landed before the operation ran would be read
 * in one go, and what its caller spread out over time would arrive with no spread at all.
 */
export async function computation(input) {
  const stream = input.content.stream ?? input.content

  let first
  let last

  for await (const chunk of stream) {
    first ??= Date.now()
    last = Date.now()
    void chunk
  }

  return { flowing: last - first > 100 }
}
