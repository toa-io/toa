declare namespace toa.filesystem.file {
  interface Read {
    (file: string): Promise<string>

    sync(file: string): string
  }

  interface Write {
    (file: string, contents: string): Promise<void>

    sync(file: string, contents): void
  }
}

export const read: toa.filesystem.file.Read
export const write: toa.filesystem.file.Write
export const lines: (file: string) => Promise<string[]>
export const glob: (pattern: string) => Promise<string[]>
