declare namespace toa.generic {
  type Concat = (...strings: Array<string | undefined>) => string
}

export const concat: toa.generic.Concat
