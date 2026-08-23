import { effect as create } from './create'
import type { Context, Scheme } from './types'

export async function effect (input: Input, context: Context): Promise<Output | Error> {
  const credential = await create(input, context)

  return credential instanceof Error ? credential : { id: credential.identity }
}

export interface Input {
  authority: string
  scheme: Scheme
  credentials: string
  id: string
}

export interface Output {
  id: string
}
