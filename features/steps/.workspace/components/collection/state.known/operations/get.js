import { CACHE_KEY } from './.common/constants.js'

export async function computation (_, context) {
  return context.state[CACHE_KEY]
}
