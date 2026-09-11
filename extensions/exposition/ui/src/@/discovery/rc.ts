import { origin } from '@/net'
import { authenticated } from '@/iam'
import { server, tree } from './svc/store'
import { read } from './svc/net'

/**
 * What is served is what this identity may reach, so a different identity is a different
 * answer — not a stale one. `bind` empties the tree when the account goes, but emptying is
 * not answering: signing out has an anonymous tree to show, and signing in has more than
 * the anonymous one. Both are read again here.
 */
export function rc(): void {
  /*
   * What answered, taken off whatever answered: one gateway serves this page and every
   * reply it reads, so any reply carries the same line.
   *
   * The gateway names itself in `exposition`; `server` is whoever stands in front of it and
   * took that header for their own — a CDN names itself there, and a deployment with nothing
   * in front sends none. So the two read as one line: what serves this, and what it came
   * through. Without the first there is nothing to say, and a bare `cloudflare` says nothing.
   */
  origin.events.on('response', ({ headers }) => {
    const gateway = headers.get('exposition')

    if (gateway === null) return

    const through = headers.get('server')

    server.set(through === null ? gateway : `${gateway} ${through}`)
  })

  let identified: boolean | undefined

  authenticated.subscribe((value) => {
    // the first value is what it already was, and nothing has changed by arriving at it
    if (identified === undefined) {
      identified = value

      return
    }

    if (value === identified) return

    identified = value

    void refresh()
  })
}

async function refresh(): Promise<void> {
  const answer = await read()

  if (!(answer instanceof Error)) tree.set(answer)
}
