import { get } from 'svelte/store'
import { meta, origin } from '@/net'
import { challenge } from '@/iam/svc/store'
import type { Discovered } from './Discovered'
import type { Answer, Call } from './Answer'

/*
 * The resource appends the trailing slash and the endpoint answers at either. `OPTIONS`
 * because that is what describes a resource — here, every one of them at once.
 */
const discovery = origin.resource<Discovered>('/.discovery')

/**
 * The tree this caller may reach. A credential is sent only where there is one: the
 * gateway describes an anonymous route to anyone, so the page reads without signing in,
 * and signing in adds what that identity may reach besides.
 */
export async function read(): Promise<Discovered | Error> {
  const credentialed = get(challenge) !== null

  return await discovery.json({
    method: 'OPTIONS',
    ...(credentialed ? { credentials: 'include' } : {}),
  })
}

/**
 * One call, made at a path this caller read out of the tree. Whatever comes back is an
 * answer: a refusal says as much about the resource as a reply does, and both are what
 * the caller asked to see.
 *
 * A credential goes only where the method takes one. An `anonymous` route refuses a caller
 * presenting one — the reply would not be cacheable — so sending it to a public method is
 * a `403` where nothing was needed at all.
 */
export async function call(of: Call): Promise<Answer> {
  const credentialed = of.guarded && get(challenge) !== null

  const answered = await origin.resource(of.path).json({
    method: of.verb,
    ...(of.body === undefined ? {} : { body: of.body }),
    ...(credentialed ? { credentials: 'include' } : {}),
  })

  if (answered instanceof Error) {
    const code = (answered as { code?: unknown }).code

    return {
      status: typeof code === 'number' ? code : 0,
      body: answered.cause ?? answered.message,
      ok: false,
    }
  }

  const answer = typeof answered === 'object' && answered !== null ? meta(answered) : null

  return { status: answer?.status ?? 200, body: answered, ok: true }
}
