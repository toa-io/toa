<script lang="ts">
  import { List, LogOut, Search, Waypoints } from '@lucide/svelte'
  import { only, query } from '@/introspection/ui'
  import { Authenticated, Authorized } from '@/iam/ui'
  import { logout } from '@/iam'
  import { Kbd } from '$ui/kbd'
  import { Input } from '$ui/input'
  import { Button } from '$ui/button'
  import { apple } from '$lib/tools'
  import { dict } from '$lib/intl'
  import { meta } from '$config'
  import { page } from '$app/state'
  import { base } from '$app/paths'
  import { onNavigate } from '$app/navigation'

  const { children } = $props()

  // a filter is about the screen it was typed on, and the next screen is not that one
  onNavigate(() => query.set(''))

  /** What an account needs to read the map. `auth:role` in both component manifests. */
  const ROLE = 'system:introspection'

  let filter = $state<HTMLInputElement | null>(null)

  /** With one thing left, the key does what pressing that thing does. */
  function enter(event: KeyboardEvent): void {
    if (event.key !== 'Enter') return

    $only?.()
  }

  // the shortcut every search field has; ⌘ on Apple, Ctrl everywhere else
  function shortcut(event: KeyboardEvent) {
    if (event.key !== 'k' || !(event.metaKey || event.ctrlKey)) return

    event.preventDefault()
    filter?.focus()
    filter?.select()
  }

  const tabs = $derived([
    { id: 'map', href: `${base}/`, label: $dict.nav.map, Icon: Waypoints },
    { id: 'list', href: `${base}/list/`, label: $dict.nav.list, Icon: List },
  ])

  /**
   * The deepest tab the address is inside, so a component opened on the map keeps the map
   * marked. Deepest rather than matching: every address starts with the list's.
   */
  const inside = $derived(
    tabs
      .map((tab) => tab.href)
      .filter((href) => page.url.pathname.startsWith(href))
      .reduce((deepest, href) => (href.length > deepest.length ? href : deepest), ''),
  )
</script>

<svelte:window onkeydown={shortcut} />

<Authenticated>
  <div class="flex h-dvh flex-col">
    <!-- named, so the chrome stays put while the screen under it changes: what is not
         named is the page, and the page is what a view transition moves -->
    <header class="flex items-center gap-4 px-4 py-3" style="view-transition-name: chrome">
      <h1 class="hidden text-lg font-medium md:block">{meta.title}</h1>

      <nav class="flex gap-1">
        {#each tabs as tab (tab.id)}
          {@const active = tab.href === inside}

          <a
            id={`nav-${tab.id}-link`}
            href={tab.href}
            aria-current={active ? 'page' : undefined}
            aria-label={tab.label}
            class={[
              'inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-sm transition-colors',
              active ? 'bg-muted font-medium' : 'text-muted-foreground hover:text-foreground',
            ]}
          >
            <tab.Icon class="size-4" />
            <span class="hidden md:inline">{tab.label}</span>
          </a>
        {/each}
      </nav>

      <div class="relative w-full max-w-64 min-w-0">
        <Search
          class="text-muted-foreground pointer-events-none absolute start-2.5 top-1/2 size-3.5 -translate-y-1/2"
        />

        <Input
          id="nav-filter-input"
          type="search"
          bind:ref={filter}
          bind:value={$query}
          onkeydown={enter}
          aria-label={$dict.nav.filter}
          class="ps-8 pe-3 md:pe-14 [&::-webkit-search-cancel-button]:hidden"
        />

        <Kbd class="absolute end-2 top-1/2 hidden -translate-y-1/2 md:inline-flex">{apple ? '⌘K' : 'Ctrl K'}</Kbd>
      </div>

      <!-- the label is the first thing to go when the header runs out of room -->
      <Button
        id="iam-logout-button"
        variant="ghost"
        aria-label={$dict.nav.signout}
        class="ms-auto"
        onclick={logout}
      >
        <LogOut />
        <span class="hidden md:inline">{$dict.nav.signout}</span>
      </Button>
    </header>

    <main class="min-h-0 flex-1">
      <!-- the same role the map's own API is read through, declared in the manifests of
           `introspection.nodes` and `introspection.edges`. Gating here rather than letting
           the page ask and be refused is what keeps the request from being made at all:
           the stores fetch when something subscribes, and nothing does. -->
      <Authorized role={ROLE}>
        {@render children()}
      </Authorized>
    </main>
  </div>
</Authenticated>
