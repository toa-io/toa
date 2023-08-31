import { type Endpoint } from './Endpoint'
import { type Family } from './Directive'
import { type Branch } from './Branch'
import type * as RTD from './RTD'

export type Context = RTD.Context<Endpoint, Family, Branch>
