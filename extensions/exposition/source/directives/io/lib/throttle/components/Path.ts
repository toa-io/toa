import type { Context } from '../../../../../HTTP/index.ts'
import type { Component } from './Component.ts'

export class Path implements Component {
  public get(context: Context): string {
    return context.url.pathname
  }
}
