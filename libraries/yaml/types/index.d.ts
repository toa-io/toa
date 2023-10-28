export function parse<T = any> (yaml: string): T

export async function patch (path: string, diff: object): Promise<void>

export async function load<T = any> (path: string): Promise<T>

export const load = {
  sync: <T = any> (path: string) => T,
}
