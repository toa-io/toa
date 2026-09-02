import { origin } from '@/net'
import type { CreationOptions, RequestOptions } from './Options'

const challenges = origin.resource('/identity/passkeys/challenges/')

export function post(type: 'creation', id?: string): Promise<CreationOptions | Error>
export function post(type: 'request', id?: string): Promise<RequestOptions | Error>

export async function post(type: Type, id?: string): Promise<CreationOptions | RequestOptions | Error> {
  const body = { type }

  if (id === undefined) return await challenges.json('.', { method: 'POST', body })
  else return await challenges.json(id, { method: 'POST', body })
}

type Type = 'creation' | 'request'
