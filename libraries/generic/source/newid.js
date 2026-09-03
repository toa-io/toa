import { randomUUID } from 'node:crypto'

export const newid = () => {
  return randomUUID().replace(/-/g, '')
}
