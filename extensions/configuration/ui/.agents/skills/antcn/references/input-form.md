# InputForm

Centered text field in a form that submits on blur when the value changed, or on Enter. Empty blur resets to the initial value. `onsubmit` may return a new string to sync the field after save.

## Notes

Exposes an imperative `focus()` method — bind the instance (`bind:this`) and call it to move focus to the field (e.g. when revealing the form).

## Usage

```svelte
<script lang="ts">
  import { InputForm } from '$com/input-form'

  let name = $state('Alex')
</script>

<InputForm
  value={name}
  onsubmit={async (value) => {
    name = value
    return value
  }}
/>
```

## Props

| Prop       | Type                                                              | Default | Notes                                              |
| ---------- | ----------------------------------------------------------------- | ------- | -------------------------------------------------- |
| `value`       | `string`                                                          | —             | Initial/current value; resets to this when cleared. |
| `class`       | `ClassValue`                                                      | —             | Extra classes on the shadcn `Input`.               |
| `placeholder` | `string`                                                          | `'Enter name'`| Placeholder text when the field is empty.          |
| `onsubmit`    | `(value: string) => Promise<string \| undefined> \| string \| undefined` | —       | Called on blur (if changed) or form submit. Return a string to update the field. |
