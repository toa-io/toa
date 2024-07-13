export function format (entry: object): Buffer {
  return Buffer.from(JSON.stringify(entry) + '\n')
}
