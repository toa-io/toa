import { setTimeout } from 'node:timers/promises'

export async function effect(_) {
  await setTimeout(20)

  return new Error('ERROR')
}
