import { type Endpoint } from './Endpoint'
import { type Directives } from './Directive'
import { type Branch } from './Branch'
import type * as RTD from './RTD'

export type Context = RTD.Context<Endpoint, Directives, Branch>
