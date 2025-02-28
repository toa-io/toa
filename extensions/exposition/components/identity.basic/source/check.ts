import type { Context } from './types'

export async function computation (input: Input, context: Context): Promise<void | null | Error> {
  const username = Buffer.from(input.username, 'base64url').toString()

  const found = await context.local.observe({
    query: { criteria: `authority==${input.authority};username=='${username}'` }
  })

  if (found instanceof Error)
    return found

  if (found === null)
    return null
}

interface Input {
  authority: string
  username: string
}
