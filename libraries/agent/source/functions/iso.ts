export function iso (value: string): string {
  const time = value === '' ? Date.now() : Number.parseInt(value)

  return new Date(time).toISOString()
}
