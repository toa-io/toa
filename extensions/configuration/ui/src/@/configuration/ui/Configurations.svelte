<script lang="ts">
  import { Async, ok } from 'svas'
  import { configurations, type Configuration } from '@/configuration'
  import { Separator } from '$ui/separator'
  import { base } from '$app/paths'
  import { goto } from '$app/navigation'
  import { only, query, rank, system } from './ui'
  import { dict } from './intl'
  import Row from './Row.svelte'
  import type { Props } from './Configurations'

  const { class: className, ...props }: Props = $props()

  const list = $derived(ok($configurations) ? $configurations : [])

  const shown = $derived(
    list
      .map((item) => ({ item, rank: rank(item, $query) }))
      .filter((ranked) => ranked.rank > 0)
      .sort(order)
      .map((ranked) => ranked.item),
  )

  /** Best answers first, then by name; the service returns them in its own order. */
  function order(a: Ranked, b: Ranked) {
    return b.rank - a.rank || a.item.component.localeCompare(b.item.component)
  }

  /**
   * What the application declared, then what it was given. A band the filter has emptied
   * is not a band: its heading would say there is something there and there is not.
   */
  function group(items: Configuration[]) {
    return [
      { id: 'user', label: $dict.space.user, of: items.filter((it) => !system(it.component)) },
      { id: 'system', label: $dict.space.system, of: items.filter((it) => system(it.component)) },
    ].filter((band) => band.of.length > 0)
  }

  interface Ranked {
    item: Configuration
    rank: number
  }

  // with one row left there is nothing to choose, so the key does what pressing it does
  $effect(() => {
    const single = shown.length === 1 ? shown[0].id : null

    only.set(single === null ? null : () => void goto(`${base}/${single}/`))

    return () => only.set(null)
  })
</script>

<Async store={configurations}>
  {#snippet awaited()}
    {#if list.length === 0}
      <p class="text-muted-foreground py-20 text-center">{$dict.values.empty}</p>
    {:else if shown.length === 0}
      <p class="text-muted-foreground py-20 text-center">{$dict.values.nomatch}</p>
    {:else}
      <div class={['flex flex-col gap-6', className]} {...props}>
        {#each group(shown) as band (band.id)}
          <section class="flex flex-col gap-2">
            <div class="text-muted-foreground flex items-center gap-3">
              <span class="text-xs font-medium tracking-wide uppercase">{band.label}</span>
              <Separator class="flex-1" />
            </div>

            <!-- a row says a name and nothing else, so it takes a column rather than a
                 line: as many columns as the screen has room for -->
            <div
              role="list"
              class="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
            >
              {#each band.of as item (item.id)}
                <Row configuration={item} />
              {/each}
            </div>
          </section>
        {/each}
      </div>
    {/if}
  {/snippet}
</Async>
