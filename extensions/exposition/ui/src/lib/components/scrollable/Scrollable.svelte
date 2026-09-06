<script lang="ts">
  import { onMount } from 'svelte'
  import { scrollable, INFINITY, type Props } from './Scrollable'

  const {
    children,
    infinite = false,
    align = 'start',
    bleed = false,
    gutter = false,
    class: classes,
    style,
    id,
    dir,
    controlled = false,
    scroll = 0,
    onscroll,
  }: Props = $props()

  const BLEED = 'mx-[calc(-50vw+50%)] px-[calc(50vw-50%)] scroll-px-[calc(50vw-50cqi)]'
  const GUTTER = '[&>*:first-child]:ml-[50cqw] [&>*:last-child]:mr-[50cqw]'

  let mounted = $state(false)

  onMount(() => {
    mounted = true
  })
</script>

<div {dir} class="@container" {style}>
  <div
    {id}
    {@attach scrollable({ infinite, align, scroll }, mounted)}
    {onscroll}
    class={[
      'flex no-scrollbar snap-x snap-mandatory *:shrink-0 overscroll-x-contain',
      controlled ? 'overflow-x-hidden' : 'overflow-x-auto',
      bleed && BLEED,
      gutter && !infinite && GUTTER,
      classes,
    ]}>
    {@render children?.()}
    {#if infinite}
      {#each { length: INFINITY - 1 }}
        {@render children?.()}
      {/each}
    {/if}
  </div>
</div>
