import type { Match } from '../match'
import type { Transformation } from './Transformation'
import type { ImageTransformationOptions } from 'cloudinary'

export function format (match: Match): ImageTransformationOptions | null {
  const format = FORMATS[match.format as keyof typeof FORMATS] as 'jpg' | 'webp' | undefined

  if (format === undefined)
    return null

  return { fetch_format: format }
}

function thumb (match: Match): ImageTransformationOptions | null {
  const width = match.width === undefined ? 0 : Number.parseInt(match.width)
  const height = match.height === undefined ? 0 : Number.parseInt(match.height)

  const zoom = match.zoom === undefined
    ? (width > 100 || height > 100) ? 0.5 : 1
    : Math.min(Number.parseInt(match.zoom) / 100, 1)

  return {
    width: match.width,
    height: match.height,
    crop: 'thumb',
    gravity: 'face',
    zoom
  }
}

function fit (match: Match): ImageTransformationOptions | null {
  if (match.fit_width === undefined && match.fit_height === undefined)
    return null

  return {
    crop: 'fit',
    width: match.fit_width,
    height: match.fit_height
  }
}

const FORMATS = {
  jpeg: 'jpg',
  webp: 'webp'
}

export const transformations: Transformation[] = [format, thumb, fit]
