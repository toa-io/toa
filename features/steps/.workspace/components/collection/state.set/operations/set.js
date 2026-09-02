import { CACHE_KEY } from './.common/constants.js'

async function effect (input, context) {
  context.state[CACHE_KEY] = new Set(input)
}

export { effect }
