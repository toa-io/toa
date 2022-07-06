declare namespace toa.generic {
    type Timeout = (ms: number) => Promise<unknown>
}

export const timeout: toa.generic.Timeout
