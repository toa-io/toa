import { newid } from '@toa.io/generic'

const id = () => {
  const id = newid()

  console.log(id)
}

export { id }
