interface Options {
  overwrite: boolean
  ignore: boolean
}

export function merge (target: object, source: object, options?: Partial<Options>): object

export function overwrite (target: object, source: object): object

export function add (target: object, source: object): object
