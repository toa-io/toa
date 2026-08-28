<script lang="ts">
  import { Async, combined } from 'svas'
  import { ArrowLeft } from '@lucide/svelte'
  import { edges, nodes } from '@/introspection'
  import { Button } from '$ui/button'
  import { dict } from '../intl'
  import { viewport, zoomIdentity, type Controls, type ZoomTransform } from './viewport'
  import { build } from './graph'
  import Grid from './Grid.svelte'
  import Focus from './Focus.svelte'
  import type { Props } from './Map'

  const { class: className }: Props = $props()

  let transform = $state<ZoomTransform>(zoomIdentity)
  let controls = $state<Controls | null>(null)
  let focused = $state<string | null>(null)
  const view = $state({ width: 0, height: 0 })

  /** Every arrangement opens centred, wherever the last one had been dragged to. */
  function select(id: string | null): void {
    focused = id

    controls?.reset()
  }

  function escape(event: KeyboardEvent): void {
    if (event.key === 'Escape' && focused !== null) select(null)
  }
</script>

<svelte:window onkeydown={escape} />

<div
  class={['bg-muted/30 relative touch-none overflow-hidden', className]}
  bind:clientWidth={view.width}
  bind:clientHeight={view.height}
  use:viewport={{
    onchange: (next) => (transform = next),
    onready: (next) => (controls = next),
  }}
>
  <Async store={combined(nodes, edges)}>
    {#snippet awaited([list, calls])}
      {@const graph = build(list, calls)}

      {#if graph.links.length === 0}
        <p class="text-muted-foreground absolute inset-x-0 top-4 text-center text-sm">
          {$dict.map.empty}
        </p>
      {/if}

      <div
        class="absolute top-0 left-0 origin-top-left"
        style:translate="{transform.x}px {transform.y}px"
        style:scale={transform.k}
      >
        {#if focused === null}
          <Grid {graph} {view} onselect={select} />
        {:else}
          <!-- keyed: what the reader silenced was about this card, not the next one -->
          {#key focused}
            <Focus {graph} {view} id={focused} onselect={select} />
          {/key}
        {/if}
      </div>
    {/snippet}
  </Async>

  {#if focused !== null}
    <Button variant="secondary" size="sm" class="absolute start-4 top-4" onclick={() => select(null)}>
      <ArrowLeft />
      {$dict.map.back}
    </Button>
  {/if}
</div>
