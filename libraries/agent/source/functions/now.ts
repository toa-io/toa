export function now (_: unknown, shift = '0'): string {
  const s = Number.parseInt(shift)

  return (Date.now() + s).toString()
}
