import { setTimeout } from 'node:timers/promises'

export async function effect(_) {
  await setTimeout(20)

  const err = Object.create(Error.prototype)

  err.code = 'ERROR'
  err.message = 'Something went wrong'

  return err
}
