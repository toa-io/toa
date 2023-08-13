export function copy (source: string, target: string): Promise<void>

export function ensure (path: string): Promise<string>

export function find (reference: string, base: string, indicator?: string): string

export function glob (pattern: string): Promise<string[]>

export function is (path: string): Promise<boolean>

export function remove (path: string): Promise<void>

export function temp (prefix?: string): Promise<string>

export function pkg (id: string, rel?: string): string
