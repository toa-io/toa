import { newid } from '@toa.io/generic'

export const id = () => {
  const id = newid()

  console.log(id)
}
