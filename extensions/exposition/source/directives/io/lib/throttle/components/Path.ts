import type { Context } from '../../../../../HTTP'
import type { Component } from './Component'

export class Path implements Component {
  public get (context: Context): string {
    return context.url.pathname
  }
}
