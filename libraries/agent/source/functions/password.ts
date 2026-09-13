import { randomInt } from 'node:crypto'

export function password(_?: unknown, length: string = '16'): string {
  const l = Number.parseInt(length)

  return Array.from({ length: l }, () => CHARSET[randomInt(CHARSET.length)]).join('')
}

const CHARSET = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
