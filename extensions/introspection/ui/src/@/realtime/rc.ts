import { account, authenticated } from '#/iam/index.js'
import { disconnect, connect } from './svc/connect'

export function rc() {
  authenticated.subscribe((authenticated) => {
    const me = account.extract()!

    if (!authenticated) disconnect()
    else void connect(me.id)
  })
}
