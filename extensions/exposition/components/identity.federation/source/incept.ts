import { effect as create } from './create.js'
import { principal } from './lib/index.js'
import type { Context, Scheme } from './types/index.js'

export async function effect (input: Input, context: Context): Promise<Output | Error> {
  const credential = await create(input, context)

  if (credential instanceof Error)
    return credential

  await principal(credential, context)

  return { id: credential.identity }
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
