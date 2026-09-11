import { authorization } from './auth/index.ts'
import { cache } from './cache/index.ts'
import { cors } from './cors/index.ts'
import { censor } from './censor/index.ts'
import { dev } from './dev/index.ts'
import { octets } from './octets/index.ts'
import { io } from './io/index.ts'
import { map } from './map/index.ts'
import { mcp } from './mcp/index.ts'
import { req } from './require/index.ts'
import { flow } from './flow/index.ts'
import { help } from './help/index.ts'
import { discovery } from './oauth/index.ts'
import { Site } from '../Discovery/index.ts'
import type { DirectiveFamily } from '../RTD/index.ts'
import type { Interceptor } from '../Interception.ts'

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
