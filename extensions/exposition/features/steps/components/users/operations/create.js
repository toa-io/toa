export function transition(input, entry) {
  if (input.name === 'return_error') {
    const e = new Error()

    e.code = 0

    return e
  }

  return Object.assign(entry, input)
}
