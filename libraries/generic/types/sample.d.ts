declare namespace toa.generic {
    type Sample = <T>(array: T[]) => T
}

export const sample: toa.generic.Sample
