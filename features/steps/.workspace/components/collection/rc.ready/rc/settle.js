import { whoami } from '../lib/whoami.js'

export async function settle(context) {
  context.state.settle = await whoami(context)
}
