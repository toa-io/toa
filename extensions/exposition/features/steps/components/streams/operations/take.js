export async function computation(input) {
  const { type, stream } = input.content

  let size = 0

  for await (const chunk of stream) size += chunk.length

  return { size, type }
}
