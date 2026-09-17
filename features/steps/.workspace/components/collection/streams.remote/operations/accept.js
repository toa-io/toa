/**
 * Reads what its caller writes and answers what it read. The property is the stream itself
 * where its caller said nothing about it, and the stream beside what was said where it did.
 */
export async function computation(input) {
  const stream = input.content.stream ?? input.content

  let size = 0

  for await (const chunk of stream) size += chunk.length

  return { label: input.label, size, type: input.content.type ?? null }
}
