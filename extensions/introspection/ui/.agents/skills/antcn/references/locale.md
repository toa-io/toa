# locale

Locale switching over the host svintl store. Two interchangeable switchers — `Languages` (snap-scroller) and `Language` (`Select` dropdown) — both set the active locale and fire `onselect` for persistence.

## Languages

Horizontal snap-scroller of native language names.

### Usage

```svelte
<script lang="ts">
  import { Languages } from '@/locale/ui'
</script>

<Languages />
```

`onselect` fires after the store updates — use it for side effects like persistence:

```svelte
<script lang="ts">
  import { Languages } from '@/locale/ui'
  import { me } from '@/accounts'
  import type { Locale } from '$lib/intl'

  function persist(locale: Locale) {
    void me.update({ locale })
  }
</script>

<Languages onselect={persist} />
```

### Props

| Prop       | Type                       | Default | Notes                                                                                       |
| ---------- | -------------------------- | ------- | ------------------------------------------------------------------------------------------- |
| `onselect` | `(locale: Locale) => void` | —       | Fires after the host store is set. Use it to persist or track the choice.                   |
| `infinite` | `boolean`                  | _auto_  | Forces the loop/clone scroller on or off. Defaults to on when `locales.length >= 10`.       |

### Notes

The active locale stays centered in the track. A long set (`>= 10`) loops endlessly; a short one renders once and centers via 50% gutters — dead-center whether it underfills or overflows. Centering is relative to the track's own width, so wrap it in a narrower box to constrain the window. `infinite` overrides the auto choice.

## Language

Compact `Select` for a settings row.

### Usage

```svelte
<script lang="ts">
  import { Language } from '@/locale/ui'
  import { me } from '@/accounts'
  import type { Locale } from '$lib/intl'
</script>

<Language onselect={(l: Locale) => me.update({ locale: l })} />
```

### Props

| Prop       | Type                       | Default | Notes                                                                     |
| ---------- | -------------------------- | ------- | ------------------------------------------------------------------------- |
| `onselect` | `(locale: Locale) => void` | —       | Fires after the host store is set. Use it to persist or track the choice. |
