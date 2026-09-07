import { value } from 'svas'
import { account } from '@/iam/svc/store'
import * as origin from './net'

/**
 * What the application serves. Bound to the account because what is in it is what that
 * identity may reach — signing in or out is a different answer, not a stale one.
 */
export const tree = value<origin.Discovered>({
  get: origin.read,
  persist: 'discovery:tree',
  bind: account,
})

/**
 * What answered: the `server` line the gateway signs every reply with. It arrives with a
 * reply rather than being asked for, so there is nothing to `get` — `rc` sets it from the
 * first one back.
 *
 * Not bound to the account: one gateway answers everyone, and what it calls itself says
 * nothing about who asked. Persisted so the line is there on the first frame rather than a
 * reply later.
 */
export const server = value<string>({ persist: 'discovery:server' })

export type Discovered = origin.Discovered
export type Resource = origin.Resource
export type Method = origin.Method
export type Described = origin.Described
export type Schema = origin.Schema
export type Octets = origin.Octets
