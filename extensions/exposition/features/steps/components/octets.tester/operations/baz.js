import { setTimeout } from 'node:timers/promises'

async function baz (input, context) {
  await setTimeout(30)

  return input.steps ?? null
}

export { baz as effect }
