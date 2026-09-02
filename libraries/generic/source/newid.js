import { randomUUID } from 'node:crypto'

const newid = () => {
  return randomUUID().replace(/-/g, '')
}

export { newid }
