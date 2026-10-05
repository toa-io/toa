export function transition(input, entry) {
  if (input.name === 'return_error') return new Error('0')

  return Object.assign(entry, input)
}
