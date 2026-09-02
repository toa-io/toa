import { join } from 'node:path'
import fs from 'node:fs'

function effect (input, context) {
  const path = join(import.meta.dirname, 'lenna.ascii')
  const stream = fs.createReadStream(path)

  return context.storages[input.storage].put(input.path, stream)
}

export { effect }
