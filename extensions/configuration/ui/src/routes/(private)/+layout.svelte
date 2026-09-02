<script lang="ts">
  import { LogOut, Search } from '@lucide/svelte'
  import { Authenticated, Authorized } from '@/iam/ui'
  import { logout } from '@/iam'
  import { only, query } from '@/configuration/ui'
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

  /**
   * The title leads back to the list. Every address ends in a slash, so the way up is the
   * address itself on the list and one level up on a component's screen.
   */
  const home = $derived(page.url.pathname === base + '/' ? '.' : '..')

  // a filter is about the screen it was typed on, and the next screen is not that one
  onNavigate(() => query.set(''))

  /** What an account needs to read the values. `auth:role` in the component's manifest. */
  const ROLE = 'system:configuration:get'

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
</script>

<svelte:window onkeydown={shortcut} />

<Authenticated>
  <div class="flex h-dvh flex-col">
    <!-- named, so the chrome stays put while the screen under it changes: what is not
         named is the page, and the page is what a view transition moves -->
    <header class="flex items-center gap-4 px-4 py-3" style="view-transition-name: chrome">
      <!-- the sides take equal space, which is what leaves the filter in the middle. Narrow,
           the title is gone and this side is empty: it takes no space either, so the filter
           starts at the edge rather than floating with nothing to sit between. -->
      <div class="hidden flex-1 items-center gap-4 md:flex">
        <h1 class="min-w-0 truncate text-lg font-medium">
          <a id="nav-home-link" href={home} class="hover:text-muted-foreground transition-colors"
            >{meta.title}</a
          >
        </h1>
      </div>

      <div class="relative w-full max-w-64 min-w-0 shrink">
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

        <Kbd class="absolute end-2 top-1/2 hidden -translate-y-1/2 md:inline-flex"
          >{apple ? '⌘K' : 'Ctrl K'}</Kbd
        >
      </div>

      <!-- no `min-w-0` either: the button holds its ground and the filter gives way -->
      <div class="flex flex-1 justify-end">
        <!-- the icon alone, and coloured for what it does: the word only repeated it -->
        <Button
          id="iam-logout-button"
          variant="ghost"
          size="icon"
          aria-label={$dict.nav.signout}
          class="text-destructive hover:text-destructive"
          onclick={logout}
        >
          <LogOut />
        </Button>
      </div>
    </header>

    <main class="min-h-0 flex-1">
      <!-- the role the values API is read through, declared in `configuration.values`.
           Gating here rather than letting the page ask and be refused is what keeps the
           request from being made at all: the stores fetch when something subscribes,
           and nothing does. -->
      <Authorized role={ROLE}>
        {@render children()}
      </Authorized>
    </main>
  </div>
</Authenticated>
