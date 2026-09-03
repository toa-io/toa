import type { Context } from '../../../../../HTTP/index.js'
import type { Component } from './Component.js'

/** The client address, as the request context resolved it; see `documentation/ip.md`. */
export class IP implements Component {
  public get (context: Context): string {
    return context.ip
  }
}
