export function transition(input, entries) {
  for (const entry of entries) entry.temperature = input.temperature

  return { warmed: entries.length }
}
