<script lang="ts">
  import { ChevronDown } from '@lucide/svelte'
  import * as Collapsible from '$ui/collapsible'
  import type { Props } from './Section'

  const { title, collapsible = false, children, class: className }: Props = $props()

  let open = $state(false)
</script>

<!-- no gap between the rows: a gap is a strip where the pointer is on nothing, and a
     list of rows that answer the pointer would flicker as it crossed them. Rows carry
     their own padding instead; a section of anything else asks for the spacing it wants. -->
{#if collapsible}
  <Collapsible.Root bind:open class={['flex flex-col', className]}>
    <Collapsible.Trigger
      class="text-muted-foreground hover:text-foreground flex w-fit items-center gap-1"
    >
      {@render heading(false)}

      <ChevronDown class={['size-3 transition-transform', open && 'rotate-180']} />
    </Collapsible.Trigger>

    <Collapsible.Content class={['flex flex-col', className]}>
      {@render children()}
    </Collapsible.Content>
  </Collapsible.Root>
{:else}
  <section class={['flex flex-col', className]}>
    {@render heading(true)}
    {@render children()}
  </section>
{/if}

{#snippet heading(muted: boolean)}
  <h3 class={['text-xs font-medium tracking-wide uppercase', muted && 'text-muted-foreground']}>
    {title}
  </h3>
{/snippet}
