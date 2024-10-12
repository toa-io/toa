export function unix (value: string): string {
  return Math.floor(new Date(value).getTime() / 1000).toString()
}
