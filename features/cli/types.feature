@cli
Feature: toa types

  Generate types for a Context and its components

  Scenario: Show `toa types` help
    When I run `toa types --help`
    And stdout should contain lines:
      """
      toa types
      Generate types for a Context and its components
        -p, --path
        -e, --environment
        -q, --quiet
        toa types
        toa types -p ./application
      """

  Scenario: Write the types of a Context and of its components
    Given I have a component `dummies.one`
    And I have a context
    And my working directory is ./
    When I run `toa types`
    Then the file ./components/dummies.one/types/toa.d.ts contains exact line 'export interface Component {'
    And the file ./components/dummies.one/types/toa.d.ts contains exact line 'export type Context = Base<Component>'
    And the file ./components/dummies.one/package.json contains exact line '  "name": "@components/dummies.one",'
    And the file ./components/dummies.one/package.json contains exact line '  "types": "types/index.d.ts"'
    And the file ./components/dummies.one/types/index.d.ts contains exact line 'export * from \'./toa.d.ts\''
    And the file ./types/toa.d.ts contains exact line 'export interface Remote {'
    And the file ./types/toa.d.ts contains line starting with '    one: '

  Scenario: Every component's context has an atom

    `context.atom` is there for every component, declared in no manifest. The generator writes
    it on the Context they share, as it writes `env`, `name` and `instance`.

    Given I have a component `dummies.one`
    And I have a context
    And my working directory is ./
    When I run `toa types`
    Then the file ./types/toa.d.ts contains exact line 'export interface Atom {'
    And the file ./types/toa.d.ts contains exact line '  atom: Atom'
    And the file ./types/toa.d.ts contains exact line '  lock: <T>(keys: string | string[], routine: (signal: AbortSignal & { error: Error }, context: unknown) => Promise<T>) => Promise<T>'

  Scenario: An operation returns what it declares
    Given I have a component `reply.contract`
    And I have a context
    And my working directory is ./
    When I run `toa types`
    Then the file ./components/reply.contract/types/toa.d.ts contains line starting with '  declared: '
    And the file ./components/reply.contract/types/toa.d.ts contains exact line 'export type SilentOutput = Record<string, unknown>'

  Scenario: A call to a stateful operation names the process it goes to, and is no task
    Given I have a component `stateful.counter`
    And I have a context
    And my working directory is ./
    When I run `toa types`
    Then the file ./components/stateful.counter/types/toa.d.ts contains exact line '  increment: (request: { input: IncrementInput, instance: string }, options?: Options) => Promise<IncrementOutput>'

  Scenario: A call to an ordinary operation takes no wait
    Given I have a component `stateful.counter`
    And I have a context
    And my working directory is ./
    When I run `toa types`
    Then the file ./components/stateful.counter/types/toa.d.ts contains line starting with '  open: (request: { input?: null, task?: boolean }) => '

  Scenario: An operation declaring no errors returns none
    Given I have a component `reply.contract`
    And I have a context
    And my working directory is ./
    When I run `toa types`
    Then the file ./components/reply.contract/types/toa.d.ts contains exact line '  silent: (request: { input?: null, task?: boolean }) => Promise<SilentOutput>'

  Scenario: An operation says what it is
    Given I have a component `reply.contract`
    And I have a context
    And my working directory is ./
    When I run `toa types`
    Then the file ./components/reply.contract/types/toa.d.ts contains exact line '  /** What it answers where it has nothing to say. */'

  Scenario: An operation returns the errors it declares
    Given I have a component `reply.contract`
    And I have a context
    And my working directory is ./
    When I run `toa types`
    Then the file ./components/reply.contract/types/toa.d.ts contains exact line '  declared: (request: { input?: null, task?: boolean }) => Promise<DeclaredOutput | RemoteError<"KNOWN">>'

  Scenario: Components that belong to no Context
    Given I have a component `dummies.one`
    And my working directory is ./
    When I run `toa types -c ./components/dummies.one`
    # what it is called from is not knowable here, so no Context is written
    Then the file ./components/dummies.one/types/toa.d.ts contains exact line 'export interface Component {'
    And the file ./components/dummies.one/types/index.d.ts contains exact line 'export * from \'./toa.d.ts\''

  Scenario: An evicted component still gets types

    Eviction is that Toa does not deploy it, not that it is gone: its types are still written,
    and it stays on what the Context can call.

    Given I have components:
      | dummies.one |
      | dummies.two |
    And I have a context with:
      """yaml
      evicted:
        components:
          - dummies.two
      """
    And my working directory is ./
    When I run `toa types`
    Then the file ./components/dummies.two/types/toa.d.ts contains exact line 'export interface Component {'
    And the file ./components/dummies.two/types/toa.d.ts contains exact line 'export type Context = Base<Component>'
    And the file ./types/toa.d.ts contains line starting with '    one: '
    And the file ./types/toa.d.ts contains line starting with '    two: '
