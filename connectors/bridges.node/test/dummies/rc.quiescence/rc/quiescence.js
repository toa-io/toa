export const calls = []

export async function stop() {
  calls.push('stop')
}

export async function resume() {
  calls.push('resume')
}
