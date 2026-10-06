let made = 0

export function computation() {
  return new Error('REFUSED', { cause: { made: ++made } })
}
