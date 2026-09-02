import { CACHE_KEY } from './.common/constants.js'

async function effect (input, context) {
  context.aspects.state({ [CACHE_KEY]: input })
}

export { effect }
