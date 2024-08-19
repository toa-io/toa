export function match (path: string): Match | null {
  const match = RX.exec(path)

  if (match === null)
    return null

  return match.groups as unknown as Match
}

const RX = /^(?<id>[^.]+)(?:\.((?<width>\d{1,4})?x(?<height>\d{1,4})?|(\[(?<fit_width>\d{1,4})?x(?<fit_height>\d{1,4})?]))(z(?<zoom>\d{1,3}))?)?\.(?<format>\w{1,4})$/

export interface Match {
  id: string
  width?: string
  height?: string
  fit_width?: string
  fit_height?: string
  zoom?: string
  format: string
}
