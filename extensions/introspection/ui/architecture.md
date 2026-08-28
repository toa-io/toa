# Architecture

## Domain Organization

The codebase follows a domain-driven design pattern with each domain organized under `src/@/`. Each domain contains standardized layers:

### Domain Structure Pattern

```plaintext
src/@/{domain}/
├── index.ts                # Main domain entry point
├── svc/                    # Services layer (business logic)
│   ├── index.ts            # Services entry point
│   ├── store.ts            # Data persistence & state management
│   ├── create.ts           # Service methods
│   ├── net/                # Network layer
│   │   ├── index.ts        # Network exports
│   │   ├── interface.ts    # API resource
│   │   ├── Events.ts       # Realtime event payload types
│   │   └── {Model}.ts      # Network (wire-format) types
│   └── {Model}.ts          # Linked entity
└── ui/                     # UI layer
    ├── index.ts            # UI exports
    ├── ui.ts               # Transient UI state
    ├── {Component}.svelte  # Svelte component
    └── {Component}.ts      # Component Props
```

### Layer Responsibilities

**Service Layer (`svc/`)**:

- **`store.ts`**: Manages domain state using `svas` collections, handles persistence and data binding
- **`create.ts`**: Service methods
- **`index.ts`**: Exports public service APIs

Service methods that rely on the current identity must use `await having()` from the `svas` library for safe operations (reads), and `ensure()` for unsafe ones—because reads can happen during app startup, while the current identity is initialized asynchronously, and unsafe operations are a side effect of a user action.

**Network Layer (`svc/net/`)**:

- **`net/interface.ts`**: Defines API interfaces using Resource pattern for HTTP communication
- **`net/{Model}.ts`**: Contains TypeScript interfaces, types, and constants for domain models
- **`index.ts`**: Exports public service APIs
- Service layer MUST NOT export network layer
- Entity type must be exported from `store.ts` even if is unchanged compared to the network layer

**UI Layer (`ui/`)**:

- Contains Svelte components that consume services
- Components import domain services via `@/{domain}` alias
- **`index.ts`**: Exports reusable UI components
- Transient UI state is managed in `ui.ts` file
- Active elements must have an `id` attribute that follows the pattern `{domain-or-route}-{element}-{kind}` (e.g. `iam-email-tab`, `accounts-name-input`, `me-logout-button`)

### App Domain

Some UI components are intended to be reused across multiple screens within this application, but their implementation is still application-bound (e.g., depends on app routing, app stores, domain models, product rules, or app-specific copy/branding). These components should live in the dedicated `app` domain.

### Aggregation Pattern

When entities require calculated properties that depend on data from multiple domains, use a derived store pattern to connect domains and compute enriched entities:

1. **Base Collection Store** (`internal`): Raw domain data persisted via `svas` collection
2. **Derived Aggregation Store**: Combines multiple stores using Svelte's `derived()` to compute enriched entities
3. **Pure Computation Functions**: Extract computation logic into pure functions that take all dependencies as parameters

#### Example Implementation

```typescript
// Base collection store
export const internal = collection<Group>({
  get,
  persist: 'groups',
  bind: account,
  stale: true,
  values: values<Group>(),
})

// Derived store aggregating multiple domains
const groups = derived([internal, contacts, account], ([$internal, $contacts, $account]) => {
  return $internal.map((group) => {
    return {
      ...group,
      balance: balance($group, $contacts, $account),
    }
  })
})
```

## Shared Components

Shared components are app-agnostic UI building blocks. Everything in `src/lib/components/` must be reusable across different apps without modification.

A component belongs here only if its implementation is not bound to the current application, meaning it:
• does not depend on app-specific routes, screens, or domain concepts
• does not import from domains
• does not embed product copy, branding, or business rules
• exposes configuration via props / slots / events, rather than hardcoding behavior

```plaintext
src/lib/components/
├── section/
│   ├── index.ts
│   ├── Section.svelte
│   └── Section.ts
└── shell/
    ├── index.ts
    ├── Nav.svelte
    ├── Nav.ts
    ├── Screen.svelte
    └── Screen.ts
```

## Components

### Component File

- **`{Component}.ts` is the component's TypeScript sidecar**, next to the `.svelte` file. It holds the component's types, constants, and logic — anything the markup doesn't need to state itself. A component with nothing to put there skips the file.
- **`Props` lives in `{Component}.ts`** — never declared inside `<script>`. A component with no own props still has the file whenever it owns constants or logic worth lifting out of the markup.
- **Props extend the root** — `interface Props extends RootProps`, where root is the HTML element or component rendered at the top level. Forward `class` and `{...props}` onto it. Nested-element props take distinct, non-conflicting names.
- **`class` prop is always `ClassValue`** (from `svelte/elements`), never `string`. Optional props document their default with a JSDoc `@default`.
- **EntityLike props** — components accepting entities declare an `EntityLike` interface (`Pick<Entity, …>`) with only the properties they use, to reduce coupling across domains.

```typescript
import type { ClassValue } from 'svelte/elements'

type AccountLike = Pick<Account, 'name' | 'picture'>

export interface Props {
  account: AccountLike
  /** @default 'active' */
  variant?: 'active' | 'inactive'
  class?: ClassValue
  onsubmit?: (value: Value) => Promise<void | Error>
}
```

### Decomposition

- **Split at >50 lines** (or 2+ snippet props) into smaller components.
- **Composite** (default): one public root exported as default, its parts internal.
- **Compound**: only when the composition itself is public API.
- **Props down, callbacks up** — parent owns business logic, child owns UI. Form components never call services.
- **Reuse before create** — check `src/lib/components` and `src/@/app/ui` index files before adding anything new.

### Organization

- **Order within `<script>`**: imports → state → functions → lifecycle. Define before use; pass functions directly (no arrow wrappers).
- **Naming**: one-word, meaningful. Full words over abbreviations; synonyms and analogies allowed.

## Route Areas

Routes are grouped under `src/routes/` by access:

- **`(public)`** — Everything publicly accessible, typically long-term cacheable. The group layout sets `Cache-Control` to 1 hour.
- **`(private)`** — Requires authentication.
- **`(local)`** — For local development.

## Screens

Shell `Header` (`$com/shell`) is owned by the **page** (`src/routes/**/+page.svelte`), never by domain or shared UI components. The page owns the title and explorer badges as `Header` children. Header utility buttons register via `<Utilities>` (stack; last wins), the same pattern as `<Actions>` for the bottom nav. Presentational components receive props and render body content only.

Card / Dialog `*.Header` parts are unrelated — they stay inside those compound components.

## Forms Pattern

Forms should follow a clear separation of concerns between data collection, validation, and business logic execution.

### Form Components

**Form Declaration**:

- Forms should declare a `Value` interface representing the form data structure
- Forms should accept an `onsubmit` callback prop for handling form submission
- Forms should not directly interact with domain services or perform business operations

```typescript
export interface Value {
  title: string
}

export interface Props {
  value?: Value
  onsubmit?: (value: Value) => Promise<void | Error>
}
```

### Service Connector

Bridge forms with domain services by implementing specific business operations (Create, Edit, Update, etc.)

```typescript
// Create.svelte - connects Form to something.add service
<script lang="ts">
  import { add } from '@/something'
  import { Form, type Value } from './form'

  let value: Value = $state({ title: '' })

  async function onsubmit(value: Value) {
    return await add(value)
  }
</script>

<Form {value} {onsubmit} />
```

## Svelte

### Reactivity

- **`$derived` over `$effect`** - `$effect` is almost always a symptom of bad architecture. Prefer reactive declarations. If you reach for `$effect`, reconsider the design and find a declarative solution.
- **Busy state** - Guard async operations against double-clicks with a `busy` flag; disable controls while it's set.

  ```svelte
  <script lang="ts">
    let busy = $state(false)

    async function save() {
      busy = true
      const result = await add(value)
      busy = false
      if (result instanceof Error) return
      goto('/success')
    }
  </script>
  <Button disabled={busy} onclick={save}>Save</Button>
  ```

### Persistent State

- **Prefer `svas` for app and component state** - For state that outlives a session, `svas` stores (see `/svas`) are our architectural default: `bind:` and reactivity come out of the box. Raw `localStorage` isn't forbidden, but for application and component state `svas` is preferred.

### Navigation

- **Never** use `resolve` from `$app/navigation`.

## Styling

### Array Class Syntax

Use Svelte array syntax for conditional classes (NOT cn utility):

```svelte
<!-- ✅ Preferred: Array syntax -->
<Button class={['w-full', isActive && 'bg-primary']}>
    Click me
</Button>

<div class={['flex items-center', expanded && 'bg-muted', className]}>
    Content
</div>

<!-- ❌ Avoid: cn utility (older pattern) -->
<Button class={cn('w-full', isActive && 'bg-primary')}>
```

### Discipline

- **Component styles live with the component** - put a component's own CSS in its `<style>` block, not in global `layout.css`.
- **Prefer semantic colors** - reach for `bg-card`, `text-muted-foreground`, `border-input` before raw palette values like `bg-gray-100`.
- **RTL-safe spacing** - use `ms-*`/`me-*`/`start-*`/`end-*`, never `ml-*`/`mr-*`/`left-*`/`right-*` for logical spacing.
- **No layout shift** - give elements explicit dimensions or aspect-ratio. Intrinsic image size must never determine geometry.

## Internationalization (i18n)

This project uses `svintl` (`/svintl`, `npx intl`) for all user-facing text.

**Every string a user reads goes through intl (`$dict`), never hardcoded** — regardless of how many locales exist or how much text there is to route.

**svintl translates automatically** — author the source text once; every other locale is generated. Never supply per-locale translations or code a default-language fallback.

Each domain carries its own `ui/intl/` mount whose dictionary derives from the host `$lib/intl` locale and uses **only its own** dictionary.

## Linked Entities Pattern

The Linked Entities Pattern is used to create rich domain models by composing data from multiple domains. This pattern enhances network-defined entities with related domain data, creating a more complete representation for application use.

### Pattern Overview

A linked entity extends a network model (from `net/`) with references to related entities from other domains:

```typescript
// Network model (raw API data) - defined in svc/net/Contact.ts
export interface Contact {
  id: string
  identity: string
}

// Linked entity (enriched domain model) - defined in svc/Contact.ts
export interface Contact extends net.Contact {
  account: Account // Linked entity from @/account domain
}
```

### Implementation Pattern

**Mapping Function (`map.ts`)**:

The mapping function transforms network entities into linked entities by:

1. Extracting relevant data from the network model
2. Fetching related entities from other domains
3. Combining them into a rich domain model

```typescript
import { awaited } from 'svas'
import { accounts } from '@/accounts'

export async function map(entry: net.Contact): Promise<Contact | Error> {
  const account = await awaited(accounts.get(entry.identity)) // Fetch linked Account entity

  if (account instanceof Error) return account

  return {
    ...entry,
    account, // Linked Account entity from @/account domain
  }
}
```

**Store Integration (`store.ts`)**:

The domain store uses the mapping function to transform network data into linked entities:

```typescript
export const internal = collection<Contact>({ get })

events.on('default.contacts.sync', async (entry: net.Contact) => {
  const contact = await map(entry)

  if (contact instanceof Error) return

  sync(internal, contact)
})
```

### Benefits

- **Separation of Concerns**: Network models (`net/`) remain clean API representations
- **Rich Domain Models**: Application logic works with complete, meaningful entities
- **Reusability**: Linked entities can reference shared domain models (e.g., `Account`)
- **Maintainability**: Changes to related domains are automatically reflected through references

## Static assets

Static assets must be stored in the `static/` directory or inside the component directory.

> Assets in the `routes/` directory may create multiple URLs for the same asset, which breaks caching.

Optimize images using `npx sharp --optimize`.

## Testing

Playwright BDD with Gherkin feature files for end-to-end testing.

- **Structure** - Feature files (`features/*.feature`), step definitions (`features/steps/*.ts`).
- **Generic vs domain steps** - Generic, domain-agnostic steps live in `navigaton.ts` (navigation, tapping, visibility, filling) and `typing.ts` (keyboard, random data). Domain-specific logic goes in `{domain}.ts` files. Reach for a generic step first; add a domain one only when there is no generic way to say it.
- **ID-based selectors** - Test-id pattern `{domain}-{element}-{kind}`. Add IDs when a test needs them, not preemptively.
- **Comprehensive scenarios** - Prefer fewer, complete scenarios over many small ones. Clean up unused step definitions.
- **Timeouts aren't solutions** - Fix the flow rather than masking a broken one with `{ timeout }`. Assert on URL and content instead.

```gherkin
Scenario: Create and favorite contact
  Given new account
  When I tap 'nav-contacts-button'
  And I tap 'contacts-new-button'
  And I type random name
  And I tap 'contacts-save-button'
  Then 'contact-name' contains that name
```

```typescript
When('I tap {string}', async ({ page }, id) => {
  await page.locator(`#${id}`).click()
})

Then('{string} contains that name', async ({ page, ctx }, id) => {
  await expect(page.locator(`#${id}`)).toContainText(ctx.name)
})
```

### Running Tests

```bash
npx feat                                                      # all tests
npx feat features/authentication.feature                      # specific feature
npx feat features/authentication.feature --name "scenario name"
APP_URL=https://evnapp.com npx feat                           # against production
```
