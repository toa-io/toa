import * as stage from '@toa.io/userland/stage'

/**
 * @param {string} id
 * @returns {Promise<toa.core.Component>}
 */
export const remote = async (id) => {
  return stage.remote(id)
}
