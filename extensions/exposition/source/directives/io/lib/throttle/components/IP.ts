import type { Context } from '../../../../../HTTP/index.js'
import type { Address } from '../../../../../Annotation.js'
import type { Component } from './Component.js'

/**
 * The client address: the connection's, or the value a trusted proxy in front of the gateway
 * writes into the header the deployment names. Of a header holding a list, the last value is
 * the one that proxy appended.
 */
export class IP implements Component {
  private readonly header?: string

  public constructor (_: unknown, __: string, address?: Address) {
    this.header = address?.header?.toLowerCase()
  }

  public get (context: Context): string {
    return this.named(context) ?? context.request.socket.remoteAddress ?? ''
  }

  private named (context: Context): string | undefined {
    if (this.header === undefined)
      return

    const value = context.request.headers[this.header]
    const raw = Array.isArray(value) ? value[value.length - 1] : value

    if (raw === undefined)
      return

    const last = raw.slice(raw.lastIndexOf(',') + 1).trim()

    return last === '' ? undefined : last
  }
}
