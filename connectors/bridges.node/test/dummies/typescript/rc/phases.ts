export const calls: string[] = []

export async function preflight (): Promise<void> {
  calls.push('preflight')
}

export async function settle (): Promise<void> {
  calls.push('settle')
}

export async function dispose (): Promise<void> {
  calls.push('dispose')
}
