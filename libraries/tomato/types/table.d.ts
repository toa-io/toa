declare namespace toa.tomato {

  interface Table {
    rows(): any[][]

    raw(): any[][]

    transpose(): Table
  }

  namespace table {
    type Constructor = (table: any[][]) => Table
  }

}

export const table: toa.tomato.table.Constructor
