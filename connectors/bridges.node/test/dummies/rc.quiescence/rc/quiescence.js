export const calls = []

export async function pause() {
  calls.push('pause')
}

export async function resume() {
  calls.push('resume')
}
