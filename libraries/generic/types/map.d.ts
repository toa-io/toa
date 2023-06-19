export function map<T = object, R = object> (input: T, transformer: Transformer<T, R>): R

interface Transformer<T, R> {
  (key: keyof T, value: T[keyof T]): [keyof R, R[keyof R]]
}
