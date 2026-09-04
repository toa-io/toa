export interface Operation<Input = unknown, Output = unknown, Context = unknown, Scope = unknown> {
  mount?: (context: Context) => void | Promise<void>
  unmount?: () => void | Promise<void>
  execute: (input: Input, scope: Scope) => Promise<Output>
}
