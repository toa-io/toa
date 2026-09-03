import type { Context } from '../../../../../HTTP/index.js'
import type { Component } from './Component.js'

export class Path implements Component {
  public get (context: Context): string {
    return context.url.pathname
  }
}
