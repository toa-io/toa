import { dev } from './dev'
import { authorization } from './auth'
import { cache } from './cache'
import { octets } from './octets'
import { cors } from './cors'
import { vary } from './vary'
import type { DirectiveFamily } from '../RTD'
import type { Interceptor } from '../Interception'

export const families: DirectiveFamily[] = [authorization, cache, octets, vary, dev]
export const interceptors: Interceptor[] = [cors]
