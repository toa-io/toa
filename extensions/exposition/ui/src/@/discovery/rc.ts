import { authenticated } from '@/iam'
import { tree } from './svc/store'
import { read } from './svc/net'

/**
 * What is served is what this identity may reach, so a different identity is a different
 * answer — not a stale one. `bind` empties the tree when the account goes, but emptying is
 * not answering: signing out has an anonymous tree to show, and signing in has more than
 * the anonymous one. Both are read again here.
 */
function rc(): void {
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

export { rc }
