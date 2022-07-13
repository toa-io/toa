declare namespace toa.generic {

  type Encode = (input: any) => string

  type Decode = (string: string) => any

}

export const encode: toa.generic.Encode
export const decode: toa.generic.Decode
