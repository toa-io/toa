import { parseSync } from 'oxc-parser'

/**
 * What a module exports, read from its source: the name, and what the value is declared as.
 * Nothing is imported, so what a module depends on need not be installed to read it.
 *
 * The parser is a dependency and not an optional peer, though a composition carries the
 * manifest its build normalised and reads no source: what an extension ships is normalised
 * where it runs — in a service's own image, and in a composition that hosts one — and nothing
 * bakes those. Make it optional again only once they read the digest instead.
 */
export function exports(path: string, text: string): Exports {
  const { program, errors } = parseSync(path, text)

  if (errors.length > 0) throw new Error(`${path}: ${errors[0].message}`)

  const locals = declarations(program.body)
  const exported: Exports = new Map()

  for (const node of program.body) {
    if (node.type === 'ExportNamedDeclaration') named(node, locals, exported)
    else if (node.type === 'ExportDefaultDeclaration')
      exported.set('default', binding(node.declaration, locals))
    else if (node.type === 'ExpressionStatement') assigned(node.expression, locals, exported)
  }

  return exported
}

export type Exports = Map<string, Binding>

export interface Binding {
  /** what the value is declared as, or `other` where it is computed rather than written */
  kind: 'function' | 'class' | 'other'
  /** the name a function or class is declared with, which a default export is known by */
  declared?: string
  /** the parameters' names, `undefined` for one that is not a plain identifier */
  params?: Array<string | undefined>
  /** a class's methods with their parameters */
  methods?: Record<string, Array<string | undefined>>
}

function named(node: any, locals: Locals, exported: Exports): void {
  if (node.exportKind === 'type') return

  const declaration = node.declaration

  if (declaration !== null && declaration !== undefined)
    for (const [name, bound] of declared(declaration)) exported.set(name, bound)

  for (const specifier of node.specifiers ?? []) {
    if (specifier.exportKind === 'type') return

    exported.set(name(specifier.exported), binding(specifier.local, locals))
  }
}

/** `module.exports = { … }`, `module.exports.x = …` and `exports.x = …` */
function assigned(expression: any, locals: Locals, exported: Exports): void {
  if (expression.type !== 'AssignmentExpression' || expression.operator !== '=') return

  const target = expression.left

  if (target.type !== 'MemberExpression') return

  if (isModuleExports(target)) {
    if (expression.right.type === 'ObjectExpression')
      properties(expression.right, locals, exported)

    return
  }

  const object = target.object

  if (isModuleExports(object) || (object.type === 'Identifier' && object.name === 'exports'))
    exported.set(name(target.property), binding(expression.right, locals))
}

/** `{ computation, condition: () => … }` — each property is an export. */
function properties(object: any, locals: Locals, exported: Exports): void {
  for (const property of object.properties) {
    if (property.type !== 'Property') continue

    exported.set(name(property.key), binding(property.value, locals))
  }
}

function isModuleExports(node: any): boolean {
  return (
    node.type === 'MemberExpression' &&
    node.object.type === 'Identifier' &&
    node.object.name === 'module' &&
    name(node.property) === 'exports'
  )
}

/** Every top-level declaration, which a specifier or a shorthand property refers to by name. */
function declarations(body: any[]): Locals {
  const locals: Locals = new Map()

  for (const node of body) {
    const declaration =
      node.type === 'ExportNamedDeclaration' ? node.declaration : node

    if (declaration === null || declaration === undefined) continue

    for (const [name, bound] of declared(declaration)) locals.set(name, bound)
  }

  return locals
}

function declared(node: any): Array<[string, Binding]> {
  switch (node.type) {
    case 'FunctionDeclaration':
    case 'ClassDeclaration':
      return node.id === null ? [] : [[node.id.name, binding(node)]]
    case 'VariableDeclaration':
      return node.declarations
        .filter((declarator: any) => declarator.id.type === 'Identifier')
        .map((declarator: any) => [
          declarator.id.name,
          declarator.init === null ? OTHER : binding(declarator.init)
        ])
    default:
      return []
  }
}

function binding(node: any, locals?: Locals): Binding {
  switch (node.type) {
    case 'FunctionDeclaration':
    case 'FunctionExpression':
    case 'ArrowFunctionExpression':
      return { kind: 'function', declared: node.id?.name, params: parameters(node.params) }
    case 'ClassDeclaration':
    case 'ClassExpression':
      return { kind: 'class', declared: node.id?.name, methods: methods(node.body.body) }
    case 'Identifier':
      return locals?.get(node.name) ?? OTHER
    default:
      return OTHER
  }
}

function methods(body: any[]): Record<string, Array<string | undefined>> {
  const methods: Record<string, Array<string | undefined>> = {}

  for (const member of body) {
    if (member.key === undefined || member.key.type === 'PrivateIdentifier') continue

    if (member.type === 'MethodDefinition') methods[name(member.key)] = parameters(member.value.params)
    else if (
      member.type === 'PropertyDefinition' &&
      member.value !== null &&
      (member.value.type === 'ArrowFunctionExpression' ||
        member.value.type === 'FunctionExpression')
    )
      methods[name(member.key)] = parameters(member.value.params)
  }

  return methods
}

/** A name is what is read: a pattern, a rest or a `this` annotation is not a name. */
function parameters(params: any[]): Array<string | undefined> {
  return params.map((param) => {
    const pattern = param.type === 'AssignmentPattern' ? param.left : param

    return pattern.type === 'Identifier' ? pattern.name : undefined
  })
}

function name(key: any): string {
  return key.type === 'Identifier' ? key.name : String(key.value)
}

type Locals = Map<string, Binding>

const OTHER: Binding = { kind: 'other' }
