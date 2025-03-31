import type { Context } from '../../../../../HTTP'
import type { Component } from './Component'

export class IP implements Component {
  public get (context: Context): string {
    return this.xff(context) ?? context.request.socket.remoteAddress ?? ''
  }

  private xff (context: Context): string | undefined {
    const xff = context.request.headers['x-forwarded-for']

    if (xff === undefined || typeof xff === 'string')
      return xff

    let ip

    for (const value of xff) {
      ip = value.trim()

      if (!local(ip))
        return ip
    }

    return ip // last otherwise
  }
}

function local (ip: string): boolean {
  return (
    ip === 'unknown' ||
    ip === '' ||
    ip === '127.0.0.1' ||
    ip === '::1' ||
    ip.startsWith('10.') ||
    ip.startsWith('192.168.') ||
    ip.match(/^172\.(1[6-9]|2[0-9]|3[0-1])\./) !== null ||
    ip.startsWith('fd') ||
    ip.startsWith('fe80:')
  )
}
