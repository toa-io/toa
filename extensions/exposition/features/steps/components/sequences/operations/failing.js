export async function* computation() {
  yield 'first'

  throw new Error('The sequence is broken')
}
