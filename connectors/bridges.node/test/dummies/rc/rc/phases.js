export const calls = []

export async function preflight() {
  calls.push('preflight')
}

export async function settle() {
  calls.push('settle')
}

export async function ready() {
  calls.push('ready')
}

export async function dispose() {
  calls.push('dispose')
}
