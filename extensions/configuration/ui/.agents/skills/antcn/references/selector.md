# Selector

Card-style option list for single- or multi-choice selection. Import as a namespace (`import * as Selector from '$com/selector'`).

## Usage

```svelte
<script lang="ts">
  import * as Selector from '$com/selector'

  let value = $state('')
  let values = $state<string[]>([])
</script>

<Selector.Root bind:value>
  <Selector.Option value="yearly">
    <Selector.Title>
      <strong>Yearly</strong>
      129,99€ per year
    </Selector.Title>
    <Selector.Description>32€ monthly</Selector.Description>
  </Selector.Option>
  <Selector.Option value="monthly">
    <Selector.Title>
      <strong>Monthly</strong>
      29,99€ per month
    </Selector.Title>
    <Selector.Description>Flexible, slightly pricier</Selector.Description>
  </Selector.Option>
</Selector.Root>

<Selector.Root bind:values type="multi" position="end">
  <Selector.Option value="notifications">
    <Selector.Title>Notifications</Selector.Title>
    <Selector.Description>Email and push alerts</Selector.Description>
  </Selector.Option>
</Selector.Root>
```

## Notes

More than one `Selector.Root` on the same page with overlapping option `value`s needs a unique `id` on each root (e.g. `id="billing"` / `id="addons"`).

## Props

### Root

| Prop       | Type                  | Default   | Notes                                              |
| ---------- | --------------------- | --------- | -------------------------------------------------- |
| `id`       | `string`              | `'radio'` | Prefix for each option’s control/label id.         |
| `type`     | `'single' \| 'multi'` | `'single'`| Single uses radio group; multi uses checkboxes.    |
| `value`    | `string`              | `''`      | Bindable selection for `type="single"`.            |
| `values`   | `string[]`            | `[]`      | Bindable selection for `type="multi"`.             |
| `position` | `'start' \| 'end'`    | `'start'` | Indicator column: leading media or trailing actions. |
| `variant`  | `ItemVariant`         | `'outline'` | Forwarded to each `Option` row.                  |
| `size`     | `ItemSize`            | —         | Forwarded to each `Option` row.                    |
| `class`    | `ClassValue`              | —         | Wrapper classes (`single` mode radio group only).  |
| `children` | `Snippet`             | —         | `Option` slots.                                    |

### Option

| Prop       | Type      | Default | Notes                                      |
| ---------- | --------- | ------- | ------------------------------------------ |
| `value`    | `string`  | —       | Option id stored in `value` / `values`.    |
| `id`       | `string`  | `{rootId}-{value}` | Override control/label id for this row. |
| `class`    | `ClassValue`  | —       | Row classes.                               |
| `children` | `Snippet` | —       | `Title` and `Description` slots.           |

### Title / Description

Pass through shadcn `Item` title and description props (`class`, etc.).
