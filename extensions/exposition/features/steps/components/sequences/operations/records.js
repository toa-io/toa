export async function* computation() {
  yield { id: '1', title: 'first', secret: 'a' }
  yield { id: '2', title: 'second', secret: 'b' }
}
