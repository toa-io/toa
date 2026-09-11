import { authorization } from './auth/index.js'
import { cache } from './cache/index.js'
import { cors } from './cors/index.js'
import { censor } from './censor/index.js'
import { dev } from './dev/index.js'
import { octets } from './octets/index.js'
import { io } from './io/index.js'
import { map } from './map/index.js'
import { mcp } from './mcp/index.js'
import { req } from './require/index.js'
import { flow } from './flow/index.js'
import { help } from './help/index.js'
import { discovery } from './oauth/index.js'
import { Site } from '../Discovery/index.js'
import type { DirectiveFamily } from '../RTD/index.js'
import type { Interceptor } from '../Interception.js'

export const families: DirectiveFamily[] = [
  authorization,
  io,
  cache,
  map,
  mcp,
  help,
  req,
  flow,
  octets,
  dev
]
/**
 * `cors` first, so a preflight is answered before anything reads the request; `censor` next,
 * so a refusal carries the CORS headers a page needs to read it; the page is last, and claims
 * its own prefix.
 */
export const interceptors: Interceptor[] = [cors, censor, discovery, new Site()]
