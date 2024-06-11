import { authorization } from './auth'
import { cache } from './cache'
import { cors } from './cors'
import { dev } from './dev'
import { octets } from './octets'
import { io } from './io'
import { vary } from './vary'
import { req } from './require'
import { flow } from './flow'
import type { DirectiveFamily } from '../RTD'
import type { Interceptor } from '../Interception'

export const families: DirectiveFamily[] = [authorization, io, cache, vary, req, flow, octets, dev]
export const interceptors: Interceptor[] = [cors]
