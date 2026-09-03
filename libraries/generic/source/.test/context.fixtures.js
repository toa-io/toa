import { context } from '../index.js'

export const increment = async (id) => {
  const storage = context(id)
  const value = storage.get()

  value.n++
}
