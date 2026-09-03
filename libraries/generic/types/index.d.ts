import { Readable } from 'stream'

export function flip (): boolean

export function plain (candidate: any): boolean

export async function timeout (ms: number): Promise<void>

export async function immediate (): Promise<void>

export function trim (input: string): string

export async function buffer (stream: Readable): Promise<Buffer>

export function traverse (object: object, visit: (node: object) => object): object

export function shards (input: string): string[]

export function echo (input: string): string
export function echo (input: string, values: Record<string, string>): string
export function echo (input: string, ...values: string[]): string

export function encode (input: any): string

export function decode<T = any> (input: string): T

export function memo<T> (fn: T): T

export function newid (): string

export function find (reference: string, base: string, indicator?: string): string

export function match (candidate: any, reference: any): boolean

export { promex } from './promex.js'
export { merge, add, overwrite } from './merge.js'
export { map } from './map.js'
export * as letters from './letters.js'

export namespace yaml {
  function load (text: string, options?: object): any
  function dump (value: any, options?: object): string
}

export function findUp (name: string, options?: { cwd?: string }): string | undefined
