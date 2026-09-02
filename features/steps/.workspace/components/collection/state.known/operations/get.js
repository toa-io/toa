import { CACHE_KEY } from './.common/constants.js'

async function computation (_, context) {
  return context.state[CACHE_KEY]
}

export { computation }
