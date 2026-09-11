import { whoami } from '../lib/whoami.js'

export async function ready(context) {
  context.state.ready = await whoami(context)
}
