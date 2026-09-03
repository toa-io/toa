import { CACHE_KEY } from './.common/constants.js'

export async function effect (input, context) {
  context.state[CACHE_KEY] = input
}
