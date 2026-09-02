import { context } from '../index.js'

const increment = async (id) => {
  const storage = context(id)
  const value = storage.get()

  value.n++
}

export { increment }
