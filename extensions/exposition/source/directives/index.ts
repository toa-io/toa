import { authorization } from './auth/index.js'
import { cache } from './cache/index.js'
import { cors } from './cors/index.js'
import { dev } from './dev/index.js'
import { octets } from './octets/index.js'
import { io } from './io/index.js'
import { map } from './map/index.js'
import { mcp } from './mcp/index.js'
import { req } from './require/index.js'
import { flow } from './flow/index.js'
import { discovery } from './oauth/index.js'
import type { DirectiveFamily } from '../RTD/index.js'
import type { Interceptor } from '../Interception.js'

export const families: DirectiveFamily[] =
  [authorization, io, cache, map, mcp, req, flow, octets, dev]
export const interceptors: Interceptor[] = [cors, discovery]
