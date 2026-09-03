import { Warning } from '../Warning.js'
import type { Context } from '../../../../../HTTP/index.js'
import type { Component } from './Component.js'

/**
 * The client address, as the request context resolved it; see `documentation/ip.md`.
 *
 * A request without one cannot be keyed, so it is let through, and whoever keys on the
 * address says so — once in a while rather than on every request, because the cause is
 * the deployment, not the request.
 */
export class IP implements Component {
  private readonly warning: Warning

  public constructor (options: unknown, route: string) {
    const subject = typeof options === 'string' ? options : throttle(route)

    this.warning = new Warning(`${subject} is not in effect: the request has no ip`)
  }

  public get (context: Context): string | undefined {
    if (context.ip === undefined)
      this.warning.emit()

    return context.ip
  }
}

function throttle (route: string): string {
  return route === '' ? 'Throttle' : `Throttle of ${route}`
}
