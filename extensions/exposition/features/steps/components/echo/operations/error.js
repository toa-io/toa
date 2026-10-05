export function computation() {
  return new Error('CODE', { cause: { reason: 'because' } })
}
