import { Readable } from 'stream'

export function flip (): boolean

export function plain (candidate: any): boolean

export async function timeout (ms: number): Promise<void>

export async function immediate (): Promise<void>

export function trim (input: string): string

export async function buffer (stream: Readable): Promise<Buffer>

export { promex } from './promex'
export { add, overwrite } from './merge'
export { map } from './map'
