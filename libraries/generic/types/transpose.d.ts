declare namespace toa.generic {
  namespace transpose {
    type Cell = string | number
  }

  type Transpose = (array: transpose.Cell[][] | transpose.Cell[]) => transpose.Cell[][]
}

export const transpose: toa.generic.Transpose
