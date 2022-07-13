declare namespace toa.generic {
    type Match = (reference: any, candidate: any) => boolean
}

export const match: toa.generic.Match
