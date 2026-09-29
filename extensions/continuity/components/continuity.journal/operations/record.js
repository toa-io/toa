export function transition(input, entry) {
  if (entry.answer === undefined) {
    entry.run = input.run
    entry.answer = input.answer
    entry.expires = input.expires
  }

  return entry.answer
}
