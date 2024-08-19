import type { ImageTransformationOptions, VideoTransformationOptions } from 'cloudinary'
import type { Match } from '../match'

export type Transformation = (match: Match) => ImageTransformationOptions | VideoTransformationOptions | null
