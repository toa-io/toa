declare namespace toa.generic.acronyms {
    type Camelcase = (string: string, length?: number) => string
}

export const camelcase: toa.generic.acronyms.Camelcase
