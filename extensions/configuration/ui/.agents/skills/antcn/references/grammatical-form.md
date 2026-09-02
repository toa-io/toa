# Grammatical form

In some languages the wording of a message depends on the subject's grammatical gender (`{name} added` vs Russian `{name} добавил` / `добавила`). svintl turns this into a translation concern, and the app stores a per-user choice — the same way it stores a chosen locale. It is **not** part of any one Solution: the mechanics live in the svintl host, the field on the account, and the picker in the consumer's profile.

## How svintl exposes it

Enable gender guidance once on the host dictionary (`$lib/intl`), listing the gender tokens your strings vary by — the **last** one is treated as the neutral/fallback form:

```bash
npx intl genders he she none   # writes `genders: [he, she, none]` to context.yaml
npx intl genders               # prints the current values
npx intl build                 # regenerates types + dictionaries
```

`build` then emits a `Grammar` union from those tokens:

```ts
// $lib/intl
export type Grammar = 'he' | 'she' | 'none' // = string when genders is unset
```

Gender-dependent phrases become `!js` functions whose **last** argument is the gender; the phrase's own arguments (if any) come first. A phrase with no other placeholders is just `(gender) => …`:

```yaml
# one own argument (name) + gender
example:
  !js
  (name, gender) => gender === 'he' ? `${name} добавил` : gender === 'she' ? `${name} добавила` : `${name} добавил(а)`
# no own arguments — single gender param
status:
  !js
  (gender) => gender === 'she' ? 'готова' : gender === 'he' ? 'готов' : 'готов(а)'
```

A language with no gender distinction for a phrase returns a plain string, not a function.

## API field

The subject's gender lives on the account as `grammar?: Grammar | null` (`Grammar` imported from `$lib/intl`). antcn's `iam` Solution already carries it on `Echo`. Persist the user's choice there.

## Two consumption modes

- **Current user** — for "you did X" texts, feed a `grammar` store derived from the active account (`$lib/intl` can expose `grammar = derived(account, $a => $a?.grammar ?? 'none')`).
- **Per subject** — for "{name} did X" texts about *other* people, pass that account's own field explicitly: `$dict.contacts.transferred.received(name, amount, account.grammar)`. Forgetting this is the common bug — the dictionary function needs the *subject's* gender, not the viewer's.

## Picker (interface pattern — not shipped by antcn)

Mirror the language switcher: a small control that edits `account.grammar` and reports the choice for persistence, exactly like the `locale` Solution's `Languages` / `Language` report a `Locale` via `onselect`.

```svelte
<script lang="ts">
  import type { Grammar } from '$lib/intl'
  import { me } from '@/accounts'

  // value seeded from account.grammar; toggle-group over the gender tokens
  function persist(grammar: Grammar) {
    void me.update({ grammar })
  }
</script>
```

Suggested interface:

| Prop       | Type                          | Notes                                              |
| ---------- | ----------------------------- | -------------------------------------------------- |
| `value`    | `Grammar \| ''`               | Current account gender; `''` for unset             |
| `onselect` | `(grammar: Grammar) => void`  | Fires after the choice changes; persist it         |

A toggle-group of the gender tokens (e.g. `he` / `she` / `none` with icons) is the proven shape.
