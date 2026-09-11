import { setTimeout } from 'node:timers/promises'

export async function* effect(_) {
  await setTimeout(10)
  yield 'hello'

  await setTimeout(10)
  yield 'world'
}
