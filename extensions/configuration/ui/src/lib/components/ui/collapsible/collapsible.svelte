<script lang="ts">
	import { Collapsible as CollapsiblePrimitive } from "bits-ui";
	import { transit } from "$lib/tools";

	let {
		ref = $bindable(null),
		open = $bindable(false),
		...restProps
	}: CollapsiblePrimitive.RootProps = $props();
</script>

<!-- Opening and closing goes through a view transition, so that whatever is named
     animates and everything else cross-fades. Here rather than at every call site:
     a collapsible is the one thing all of them have in common. -->
<CollapsiblePrimitive.Root
	bind:ref
	bind:open={() => open, (next) => void transit(() => (open = next))}
	data-slot="collapsible"
	{...restProps}
/>
