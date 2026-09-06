<script lang="ts">
  import Schema from './Schema.svelte'
  import type { Props } from './Parameters'

  const { label, of, class: className }: Props = $props()

  const named = $derived(Object.entries(of))
</script>

<!-- each is a shape of its own, so each opens on its own: a name says what it is before
     anything about how it is checked does -->
<div class={['flex flex-col gap-1', className]}>
  {#each named as [name, schema] (name)}
    <Schema label={`${label}.${name}`} value={schema} />
  {/each}
</div>
