import * as stage from '@toa.io/userland/stage'

export const remote = async (id) => {
  return stage.remote(id)
}
