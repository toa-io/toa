import { Buffer } from 'node:buffer'
import * as yaml from 'js-yaml'

export function decode (buffer: Buffer): any {
  const text = buffer.toString()

  return yaml.load(text)
}

export function encode (value: any): Buffer {
  const text = yaml.dump(value)

  return Buffer.from(text)
}
